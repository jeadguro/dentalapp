// src/routes/settingsRoutes.js
import express from 'express';
import { protect, staffOnly, adminOnly } from '../middleware/auth.js';
import ClinicSettings from '../models/ClinicSettings.js';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';

const router = express.Router();

// @desc    Obtener configuración de la clínica
// @route   GET /api/settings
// @access  Public (algunos datos) / Private (todos)
router.get('/', async (req, res, next) => {
  try {
    const settings = await ClinicSettings.getSettings();
    
    // Datos públicos para pacientes
    const publicData = {
      name: settings.name,
      phone: settings.phone,
      address: settings.address,
      schedule: settings.schedule,
      allowPatientBooking: settings.allowPatientBooking,
      maxBookingDaysAhead: settings.maxBookingDaysAhead,
      minBookingHoursAhead: settings.minBookingHoursAhead,
      appointmentInterval: settings.appointmentInterval,
      patientBookableTypes: settings.patientBookableTypes,
      holidays: settings.holidays
    };

    res.json({
      success: true,
      data: publicData
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Actualizar configuración de la clínica
// @route   PUT /api/settings
// @access  Private/Admin
router.put('/', protect, staffOnly, adminOnly, async (req, res, next) => {
  try {
    const settings = await ClinicSettings.getSettings();
    
    const allowedFields = [
      'name', 'logo', 'phone', 'email', 'address',
      'schedule', 'defaultAppointmentDuration', 'appointmentInterval',
      'allowPatientBooking', 'maxBookingDaysAhead', 'minBookingHoursAhead',
      'requireAppointmentConfirmation', 'reminders', 'holidays', 'patientBookableTypes'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        settings[field] = req.body[field];
      }
    });

    await settings.save();

    res.json({
      success: true,
      message: 'Configuración actualizada',
      data: settings
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Obtener horarios disponibles para una fecha
// @route   GET /api/settings/available-slots
// @access  Public
router.get('/available-slots', async (req, res, next) => {
  try {
    const { date, doctorId } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'La fecha es requerida'
      });
    }

    const settings = await ClinicSettings.getSettings();
    const requestedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Verificar que la fecha no sea pasada
    if (requestedDate < today) {
      return res.json({
        success: true,
        data: { slots: [], message: 'Fecha pasada' }
      });
    }

    // Verificar que no exceda el límite de días
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + settings.maxBookingDaysAhead);
    if (requestedDate > maxDate) {
      return res.json({
        success: true,
        data: { slots: [], message: 'Fecha excede el límite permitido' }
      });
    }

    // Verificar si es día festivo
    const isHoliday = settings.holidays.some(h => {
      const holidayDate = new Date(h.date);
      return holidayDate.toDateString() === requestedDate.toDateString();
    });

    if (isHoliday) {
      return res.json({
        success: true,
        data: { slots: [], message: 'Día festivo' }
      });
    }

    // Obtener slots del día
    const allSlots = settings.getAvailableSlots(requestedDate);

    // Obtener citas existentes para ese día
    const startOfDay = new Date(requestedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(requestedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const query = {
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: ['cancelled'] }
    };

    if (doctorId) {
      query.doctor = doctorId;
    }

    const existingAppointments = await Appointment.find(query).select('date');

    // Filtrar slots ocupados
    const bookedTimes = existingAppointments.map(apt => {
      const d = new Date(apt.date);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    });

    // Filtrar slots que ya pasaron (si es hoy)
    const now = new Date();
    const minBookingTime = new Date(now.getTime() + settings.minBookingHoursAhead * 60 * 60 * 1000);

    const availableSlots = allSlots.filter(slot => {
      // Verificar si está ocupado
      if (bookedTimes.includes(slot)) return false;

      // Si es hoy, verificar que no haya pasado
      if (requestedDate.toDateString() === now.toDateString()) {
        const [hours, mins] = slot.split(':').map(Number);
        const slotTime = new Date(requestedDate);
        slotTime.setHours(hours, mins, 0, 0);
        if (slotTime < minBookingTime) return false;
      }

      return true;
    });

    res.json({
      success: true,
      data: {
        date: requestedDate.toISOString().split('T')[0],
        slots: availableSlots,
        interval: settings.appointmentInterval
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Obtener tipos de cita disponibles para pacientes
// @route   GET /api/settings/appointment-types
// @access  Public
router.get('/appointment-types', async (req, res, next) => {
  try {
    const settings = await ClinicSettings.getSettings();
    const allTypes = Appointment.getTypeLabels();
    
    const availableTypes = {};
    settings.patientBookableTypes.forEach(type => {
      if (allTypes[type]) {
        availableTypes[type] = allTypes[type];
      }
    });

    res.json({
      success: true,
      data: availableTypes
    });
  } catch (error) {
    next(error);
  }
});

export default router;

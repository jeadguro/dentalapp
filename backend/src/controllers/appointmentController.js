// src/controllers/appointmentController.js
import Appointment from '../models/Appointment.js';
import Patient from '../models/Patient.js';
import User from '../models/User.js';
import ClinicSettings from '../models/ClinicSettings.js';

// Duraciones estimadas por tipo
const durations = {
  checkup: 30, cleaning: 45, filling: 60, extraction: 45,
  rootcanal: 90, crown: 60, whitening: 60, orthodontics: 45,
  implant: 120, emergency: 30, other: 30
};

// @desc    Obtener todas las citas
// @route   GET /api/appointments
// @access  Private/Staff
export const getAppointments = async (req, res, next) => {
  try {
    const { patient, doctor, status, startDate, endDate, page = 1, limit = 100, sort = '-date' } = req.query;
    
    let query = {};
    
    if (patient) query.patient = patient;
    if (doctor) query.doctor = doctor;
    if (status) query.status = status;
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const appointments = await Appointment.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(query);

    res.json({
      success: true,
      data: {
        appointments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener una cita por ID
// @route   GET /api/appointments/:id
// @access  Private
export const getAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    // Verificar acceso si es paciente
    if (req.userType === 'patient') {
      if (appointment.patient._id.toString() !== req.patient._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado'
        });
      }
    }

    res.json({
      success: true,
      data: { appointment }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Crear cita (staff)
// @route   POST /api/appointments
// @access  Private/Staff
export const createAppointment = async (req, res, next) => {
  try {
    const { patient: patientId, date, type, notes, doctor: doctorId } = req.body;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    const doctor = await User.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor no encontrado'
      });
    }

    const startDate = new Date(date);
    const endDate = new Date(startDate.getTime() + (durations[type] || 30) * 60000);

    const appointment = await Appointment.create({
      patient: patientId,
      doctor: doctorId,
      date: startDate,
      endDate,
      type,
      notes,
      status: 'confirmed',
      createdByPatient: false
    });

    await appointment.populate('patient', 'name email phone');
    await appointment.populate('doctor', 'name specialty');

    res.status(201).json({
      success: true,
      message: 'Cita creada exitosamente',
      data: { appointment }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Crear cita (paciente)
// @route   POST /api/appointments/book
// @access  Private/Patient
export const createPatientAppointment = async (req, res, next) => {
  try {
    const { date, type, doctorId, notes } = req.body;
    const patientId = req.patient._id;

    // Obtener configuración
    const settings = await ClinicSettings.getSettings();

    // Verificar si está habilitado el agendamiento
    if (!settings.allowPatientBooking) {
      return res.status(403).json({
        success: false,
        message: 'El agendamiento de citas no está disponible en este momento'
      });
    }

    // Verificar que el tipo de cita esté permitido
    if (!settings.patientBookableTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Este tipo de cita no está disponible para agendar en línea'
      });
    }

    // Verificar que el doctor existe
    const doctor = await User.findById(doctorId);
    if (!doctor || !doctor.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Doctor no encontrado'
      });
    }

    const requestedDate = new Date(date);
    const now = new Date();

    // Verificar que no sea una fecha pasada
    if (requestedDate < now) {
      return res.status(400).json({
        success: false,
        message: 'No puedes agendar en una fecha pasada'
      });
    }

    // Verificar horas mínimas de anticipación
    const minTime = new Date(now.getTime() + settings.minBookingHoursAhead * 60 * 60 * 1000);
    if (requestedDate < minTime) {
      return res.status(400).json({
        success: false,
        message: `Debes agendar con al menos ${settings.minBookingHoursAhead} horas de anticipación`
      });
    }

    // Verificar días máximos de anticipación
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + settings.maxBookingDaysAhead);
    maxDate.setHours(23, 59, 59, 999);
    if (requestedDate > maxDate) {
      return res.status(400).json({
        success: false,
        message: `Solo puedes agendar hasta ${settings.maxBookingDaysAhead} días en el futuro`
      });
    }

    // Verificar que el horario esté disponible
    const dayOfWeek = requestedDate.getDay();
    const daySchedule = settings.schedule[dayOfWeek];
    
    if (!daySchedule || !daySchedule.enabled) {
      return res.status(400).json({
        success: false,
        message: 'La clínica no atiende ese día'
      });
    }

    // Verificar que el slot no esté ocupado
    const startOfSlot = new Date(requestedDate);
    const endOfSlot = new Date(requestedDate.getTime() + (durations[type] || 30) * 60000);

    const conflict = await Appointment.findOne({
      doctor: doctorId,
      status: { $nin: ['cancelled'] },
      $or: [
        { date: { $lt: endOfSlot }, endDate: { $gt: startOfSlot } }
      ]
    });

    if (conflict) {
      return res.status(400).json({
        success: false,
        message: 'Este horario ya no está disponible'
      });
    }

    // Verificar que el paciente no tenga otra cita ese día con el mismo doctor
    const startOfDay = new Date(requestedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(requestedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointment = await Appointment.findOne({
      patient: patientId,
      doctor: doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: ['cancelled'] }
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'Ya tienes una cita con este doctor para ese día'
      });
    }

    // Crear la cita
    const appointment = await Appointment.create({
      patient: patientId,
      doctor: doctorId,
      date: startOfSlot,
      endDate: endOfSlot,
      type,
      notes,
      status: settings.requireAppointmentConfirmation ? 'pending' : 'confirmed',
      createdByPatient: true
    });

    await appointment.populate('patient', 'name email phone');
    await appointment.populate('doctor', 'name specialty');

    res.status(201).json({
      success: true,
      message: settings.requireAppointmentConfirmation 
        ? 'Cita solicitada. Recibirás confirmación pronto.'
        : 'Cita agendada exitosamente',
      data: { appointment }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener mis citas (paciente)
// @route   GET /api/appointments/my
// @access  Private/Patient
export const getMyAppointments = async (req, res, next) => {
  try {
    const { status, upcoming } = req.query;
    
    let query = { patient: req.patient._id };
    
    if (status) {
      query.status = status;
    }
    
    if (upcoming === 'true') {
      query.date = { $gte: new Date() };
      query.status = { $nin: ['cancelled', 'done'] };
    }

    const appointments = await Appointment.find(query)
      .sort('date')
      .populate('doctor', 'name specialty avatar');

    res.json({
      success: true,
      data: { appointments }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancelar mi cita (paciente)
// @route   PUT /api/appointments/my/:id/cancel
// @access  Private/Patient
export const cancelMyAppointment = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      patient: req.patient._id
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    // Verificar que no esté ya cancelada o completada
    if (['cancelled', 'done'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: 'Esta cita no puede ser cancelada'
      });
    }

    // Verificar que sea con al menos 2 horas de anticipación
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    
    if (appointment.date < twoHoursFromNow) {
      return res.status(400).json({
        success: false,
        message: 'Solo puedes cancelar con al menos 2 horas de anticipación'
      });
    }

    appointment.status = 'cancelled';
    appointment.cancellationReason = reason || 'Cancelada por el paciente';
    appointment.cancelledBy = 'patient';
    appointment.cancelledAt = new Date();
    await appointment.save();

    res.json({
      success: true,
      message: 'Cita cancelada exitosamente',
      data: { appointment }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Actualizar cita
// @route   PUT /api/appointments/:id
// @access  Private/Staff
export const updateAppointment = async (req, res, next) => {
  try {
    const { date, type, status, notes, doctor } = req.body;

    const updateData = {};
    if (type) updateData.type = type;
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (doctor) updateData.doctor = doctor;
    
    if (date) {
      updateData.date = new Date(date);
      updateData.endDate = new Date(updateData.date.getTime() + (durations[type] || 30) * 60000);
    }

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Cita actualizada exitosamente',
      data: { appointment }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Completar cita
// @route   PUT /api/appointments/:id/complete
// @access  Private/Staff
export const completeAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'done' },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Cita marcada como completada',
      data: { appointment }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancelar cita (staff)
// @route   PUT /api/appointments/:id/cancel
// @access  Private/Staff
export const cancelAppointment = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'cancelled',
        cancellationReason: reason,
        cancelledBy: 'clinic',
        cancelledAt: new Date()
      },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Cita cancelada',
      data: { appointment }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Eliminar cita
// @route   DELETE /api/appointments/:id
// @access  Private/Staff
export const deleteAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Cita eliminada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener citas de hoy
// @route   GET /api/appointments/today
// @access  Private/Staff
export const getTodayAppointments = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await Appointment.find({
      date: { $gte: today, $lt: tomorrow }
    }).sort('date');

    res.json({
      success: true,
      data: { appointments }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener citas pendientes
// @route   GET /api/appointments/pending
// @access  Private/Staff
export const getPendingAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({
      status: 'pending',
      date: { $gte: new Date() }
    }).sort('date').limit(50);

    res.json({
      success: true,
      data: { appointments }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener estadísticas de citas
// @route   GET /api/appointments/stats
// @access  Private/Staff
export const getAppointmentStats = async (req, res, next) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [total, todayCount, pending, completed] = await Promise.all([
      Appointment.countDocuments(),
      Appointment.countDocuments({ date: { $gte: today, $lt: tomorrow } }),
      Appointment.countDocuments({ status: 'pending' }),
      Appointment.countDocuments({ status: 'done' })
    ]);

    res.json({
      success: true,
      data: { total, today: todayCount, pending, completed }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener tipos de citas (labels)
// @route   GET /api/appointments/types
// @access  Public
export const getAppointmentTypes = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        types: Appointment.getTypeLabels(),
        statuses: Appointment.getStatusLabels()
      }
    });
  } catch (error) {
    next(error);
  }
};

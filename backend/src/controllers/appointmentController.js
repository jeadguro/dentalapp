// src/controllers/appointmentController.js
import Appointment from '../models/Appointment.js';
import Patient from '../models/Patient.js';

// @desc    Obtener todas las citas
// @route   GET /api/appointments
// @access  Private/Staff
export const getAppointments = async (req, res, next) => {
  try {
    const { 
      patient, 
      status, 
      startDate, 
      endDate,
      page = 1, 
      limit = 100, 
      sort = '-date' 
    } = req.query;
    
    let query = {};
    
    if (patient) {
      query.patient = patient;
    }
    
    if (status) {
      query.status = status;
    }
    
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

// @desc    Crear cita
// @route   POST /api/appointments
// @access  Private/Staff
export const createAppointment = async (req, res, next) => {
  try {
    const { 
      patient: patientId, 
      date, 
      type,
      notes,
      assignedTo
    } = req.body;

    // Verificar que el paciente existe
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    // Calcular hora de fin estimada
    const typeLabels = Appointment.getTypeLabels();
    const durations = {
      checkup: 30, cleaning: 45, filling: 60, extraction: 45,
      rootcanal: 90, crown: 60, whitening: 60, orthodontics: 45,
      implant: 120, emergency: 30, other: 30
    };
    
    const startDate = new Date(date);
    const endDate = new Date(startDate.getTime() + (durations[type] || 30) * 60000);

    const appointment = await Appointment.create({
      patient: patientId,
      date: startDate,
      endDate,
      type,
      notes,
      assignedTo: assignedTo || req.user._id,
      status: 'pending'
    });

    // Populate para la respuesta
    await appointment.populate('patient', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Cita creada exitosamente',
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
    const { date, type, status, notes, assignedTo } = req.body;

    const updateData = { type, status, notes, assignedTo };
    
    if (date) {
      updateData.date = new Date(date);
      // Recalcular hora de fin
      const durations = {
        checkup: 30, cleaning: 45, filling: 60, extraction: 45,
        rootcanal: 90, crown: 60, whitening: 60, orthodontics: 45,
        implant: 120, emergency: 30, other: 30
      };
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

// @desc    Cancelar cita
// @route   PUT /api/appointments/:id/cancel
// @access  Private/Staff
export const cancelAppointment = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'cancelled',
        cancellationReason: reason
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
    const now = new Date();

    const appointments = await Appointment.find({
      status: 'pending',
      date: { $gte: now }
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
      data: {
        total,
        today: todayCount,
        pending,
        completed
      }
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

// src/models/Appointment.js
import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'El paciente es requerido']
  },
  date: {
    type: Date,
    required: [true, 'La fecha es requerida']
  },
  endDate: {
    type: Date // Hora de fin estimada
  },
  type: {
    type: String,
    required: [true, 'El tipo de cita es requerido'],
    enum: [
      'checkup',      // Revisión general
      'cleaning',     // Limpieza dental
      'filling',      // Empaste
      'extraction',   // Extracción
      'rootcanal',    // Endodoncia
      'crown',        // Corona
      'whitening',    // Blanqueamiento
      'orthodontics', // Ortodoncia
      'implant',      // Implante
      'emergency',    // Urgencia
      'other'         // Otro
    ],
    default: 'checkup'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in-progress', 'done', 'cancelled', 'no-show'],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Las notas no pueden exceder 500 caracteres']
  },
  // Recordatorio enviado
  reminderSent: {
    type: Boolean,
    default: false
  },
  // Motivo de cancelación
  cancellationReason: {
    type: String,
    trim: true
  },
  // Doctor asignado
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Índices
appointmentSchema.index({ patient: 1, date: -1 });
appointmentSchema.index({ date: 1 });
appointmentSchema.index({ status: 1, date: 1 });

// Virtual para duración estimada según tipo
appointmentSchema.virtual('estimatedDuration').get(function() {
  const durations = {
    checkup: 30,
    cleaning: 45,
    filling: 60,
    extraction: 45,
    rootcanal: 90,
    crown: 60,
    whitening: 60,
    orthodontics: 45,
    implant: 120,
    emergency: 30,
    other: 30
  };
  return durations[this.type] || 30;
});

// Labels en español para tipos
appointmentSchema.statics.getTypeLabels = function() {
  return {
    checkup: 'Revisión general',
    cleaning: 'Limpieza dental',
    filling: 'Empaste',
    extraction: 'Extracción',
    rootcanal: 'Endodoncia',
    crown: 'Corona',
    whitening: 'Blanqueamiento',
    orthodontics: 'Ortodoncia',
    implant: 'Implante',
    emergency: 'Urgencia',
    other: 'Otro'
  };
};

// Labels en español para estados
appointmentSchema.statics.getStatusLabels = function() {
  return {
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    'in-progress': 'En progreso',
    done: 'Completada',
    cancelled: 'Cancelada',
    'no-show': 'No asistió'
  };
};

// Populate automático
appointmentSchema.pre(/^find/, function(next) {
  if (this.options._skipPopulate) return next();
  this.populate({
    path: 'patient',
    select: 'name email phone'
  });
  next();
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;

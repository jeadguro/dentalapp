// src/models/Consultation.js
import mongoose from 'mongoose';

const toothSchema = new mongoose.Schema({
  number: { type: String, required: true },  // 11, 21, 36, etc.
  status: {
    type: String,
    enum: ['healthy', 'caries', 'missing', 'filled', 'fractured', 'other'],
    default: 'healthy'
  },
  notes: { type: String, trim: true },
  treatments: [{
    name: String,
    date: { type: Date, default: Date.now },
    notes: String
  }]
});

const consultationSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'El paciente es requerido']
  },
  date: {
    type: Date,
    required: [true, 'La fecha es requerida'],
    default: Date.now
  },
  diagnosis: {
    type: String,
    required: [true, 'El diagnóstico es requerido'],
    trim: true,
    maxlength: [500, 'El diagnóstico no puede exceder 500 caracteres']
  },
  treatment: {
    type: String,
    trim: true,
    maxlength: [500, 'El tratamiento no puede exceder 500 caracteres']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [2000, 'Las notas no pueden exceder 2000 caracteres']
  },

  // 📸 Fotos de la consulta
  photos: [{
    url: { type: String, required: true },
    publicId: { type: String },
    description: { type: String, trim: true },
    uploadedAt: { type: Date, default: Date.now }
  }],

  // 🦷 Odontograma - Objeto: { "11": { "top": "caries", "center": "resin" }, ... }
  odontogram: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // ✔️ Procedimientos adicionales (checklist)
  procedures: [{
    name: String,
    tooth: String,
    notes: String
  }],

  // 💲 Costo de la consulta
  cost: {
    type: Number,
    min: 0
  },

  // 💳 Estado del pago
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid'],
    default: 'pending'
  },

  // 👨‍⚕️ Doctor que atendió
  attendedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // 📅 Próxima cita
  nextAppointmentRecommended: {
    type: Date
  }

}, {
  timestamps: true
});

// Índices
consultationSchema.index({ patient: 1, date: -1 });
consultationSchema.index({ date: -1 });

// Populate automático del paciente
consultationSchema.pre(/^find/, function(next) {
  if (this.options._skipPopulate) return next();

  this.populate({
    path: 'patient',
    select: 'name email phone'
  });

  next();
});

const Consultation = mongoose.model('Consultation', consultationSchema);
export default Consultation;

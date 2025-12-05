// src/models/Patient.js
import mongoose from 'mongoose';
import crypto from 'crypto';

const patientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email inválido']
  },
  phone: {
    type: String,
    trim: true
  },
  birthdate: {
    type: Date
  },
  address: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Las notas no pueden exceder 1000 caracteres']
  },
  // Código único para acceso del paciente (6 caracteres alfanuméricos)
  accessCode: {
    type: String,
    unique: true,
    uppercase: true
  },
  // Token para acceso por QR o link directo
  accessToken: {
    type: String,
    unique: true
  },
  // Control de acceso
  lastAccess: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual para obtener consultas del paciente
patientSchema.virtual('consultations', {
  ref: 'Consultation',
  localField: '_id',
  foreignField: 'patient'
});

// Virtual para obtener citas del paciente
patientSchema.virtual('appointments', {
  ref: 'Appointment',
  localField: '_id',
  foreignField: 'patient'
});

// Virtual para calcular edad
patientSchema.virtual('age').get(function() {
  if (!this.birthdate) return null;
  const today = new Date();
  const birth = new Date(this.birthdate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
});

// Generar código de acceso único antes de guardar
patientSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Generar código de acceso de 6 caracteres
    let code;
    let isUnique = false;
    
    while (!isUnique) {
      code = crypto.randomBytes(3).toString('hex').toUpperCase();
      const existing = await mongoose.model('Patient').findOne({ accessCode: code });
      if (!existing) isUnique = true;
    }
    this.accessCode = code;
    
    // Generar token de acceso
    this.accessToken = crypto.randomBytes(32).toString('hex');
  }
  next();
});

// Método para regenerar código de acceso
patientSchema.methods.regenerateAccessCode = async function() {
  let code;
  let isUnique = false;
  
  while (!isUnique) {
    code = crypto.randomBytes(3).toString('hex').toUpperCase();
    const existing = await mongoose.model('Patient').findOne({ accessCode: code });
    if (!existing) isUnique = true;
  }
  
  this.accessCode = code;
  this.accessToken = crypto.randomBytes(32).toString('hex');
  await this.save();
  
  return { accessCode: code, accessToken: this.accessToken };
};

// Método para datos públicos (portal paciente)
patientSchema.methods.toPortalJSON = function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    birthdate: this.birthdate,
    age: this.age,
    address: this.address
  };
};

// Índices para búsqueda
patientSchema.index({ name: 'text', email: 'text' });
patientSchema.index({ accessCode: 1 });
patientSchema.index({ accessToken: 1 });

const Patient = mongoose.model('Patient', patientSchema);

export default Patient;

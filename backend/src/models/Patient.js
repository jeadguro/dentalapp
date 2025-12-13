// src/models/Patient.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
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
  password: {
    type: String,
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    select: false
  },
  phone: {
    type: String,
    trim: true
  },
  birthdate: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
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
  // Alergias y condiciones médicas
  allergies: {
    type: String,
    trim: true
  },
  medicalConditions: {
    type: String,
    trim: true
  },
  // Código único para acceso del paciente (6 caracteres alfanuméricos)
  accessCode: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true
  },
  // Token para acceso por QR o link directo
  accessToken: {
    type: String,
    unique: true,
    sparse: true
  },
  // ¿El paciente se registró por sí mismo?
  selfRegistered: {
    type: Boolean,
    default: false
  },
  // ¿Email verificado?
  emailVerified: {
    type: Boolean,
    default: false
  },
  // Token para verificar email
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  // Token para recuperar contraseña
  passwordResetToken: String,
  passwordResetExpires: Date,
  // Control de acceso
  lastAccess: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Doctor preferido
  preferredDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

// Encriptar contraseña antes de guardar
patientSchema.pre('save', async function(next) {
  // Solo encriptar si la contraseña fue modificada
  if (this.isModified('password') && this.password) {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  }
  
  // Generar códigos de acceso solo para pacientes nuevos sin contraseña
  if (this.isNew && !this.password) {
    let code;
    let isUnique = false;
    
    while (!isUnique) {
      code = crypto.randomBytes(3).toString('hex').toUpperCase();
      const existing = await mongoose.model('Patient').findOne({ accessCode: code });
      if (!existing) isUnique = true;
    }
    this.accessCode = code;
    this.accessToken = crypto.randomBytes(32).toString('hex');
  }
  
  next();
});

// Método para comparar contraseñas
patientSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

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

// Generar token para verificar email
patientSchema.methods.generateEmailVerificationToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 horas
  return token;
};

// Generar token para recuperar contraseña
patientSchema.methods.generatePasswordResetToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hora
  return token;
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
    gender: this.gender,
    address: this.address,
    allergies: this.allergies,
    medicalConditions: this.medicalConditions,
    selfRegistered: this.selfRegistered,
    emailVerified: this.emailVerified
  };
};

// Índices para búsqueda
patientSchema.index({ name: 'text', email: 'text' });
patientSchema.index({ accessCode: 1 });
patientSchema.index({ accessToken: 1 });
patientSchema.index({ email: 1 });

const Patient = mongoose.model('Patient', patientSchema);

export default Patient;

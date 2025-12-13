// src/models/ClinicSettings.js
import mongoose from 'mongoose';

const timeSlotSchema = new mongoose.Schema({
  start: { type: String, required: true }, // "09:00"
  end: { type: String, required: true }    // "18:00"
}, { _id: false });

const clinicSettingsSchema = new mongoose.Schema({
  // Información de la clínica
  name: {
    type: String,
    default: 'Mi Clínica Dental'
  },
  logo: String,
  phone: String,
  email: String,
  address: String,
  
  // Horarios de atención por día (0 = Domingo, 1 = Lunes, etc.)
  schedule: {
    0: { enabled: { type: Boolean, default: false }, slots: [timeSlotSchema] }, // Domingo
    1: { enabled: { type: Boolean, default: true }, slots: { type: [timeSlotSchema], default: [{ start: '09:00', end: '18:00' }] } },  // Lunes
    2: { enabled: { type: Boolean, default: true }, slots: { type: [timeSlotSchema], default: [{ start: '09:00', end: '18:00' }] } },  // Martes
    3: { enabled: { type: Boolean, default: true }, slots: { type: [timeSlotSchema], default: [{ start: '09:00', end: '18:00' }] } },  // Miércoles
    4: { enabled: { type: Boolean, default: true }, slots: { type: [timeSlotSchema], default: [{ start: '09:00', end: '18:00' }] } },  // Jueves
    5: { enabled: { type: Boolean, default: true }, slots: { type: [timeSlotSchema], default: [{ start: '09:00', end: '18:00' }] } },  // Viernes
    6: { enabled: { type: Boolean, default: true }, slots: { type: [timeSlotSchema], default: [{ start: '09:00', end: '14:00' }] } },  // Sábado
  },

  // Duración de citas por defecto (minutos)
  defaultAppointmentDuration: {
    type: Number,
    default: 30
  },

  // Intervalo entre citas (minutos)
  appointmentInterval: {
    type: Number,
    default: 30
  },

  // ¿Permitir que pacientes agenden citas?
  allowPatientBooking: {
    type: Boolean,
    default: true
  },

  // Días máximos de anticipación para agendar (pacientes)
  maxBookingDaysAhead: {
    type: Number,
    default: 7
  },

  // Horas mínimas de anticipación para agendar
  minBookingHoursAhead: {
    type: Number,
    default: 2
  },

  // ¿Requiere confirmación de la clínica?
  requireAppointmentConfirmation: {
    type: Boolean,
    default: true
  },

  // Recordatorios
  reminders: {
    enabled: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    whatsapp: { type: Boolean, default: false },
    hoursBefore: { type: [Number], default: [24, 1] } // Recordar 24h y 1h antes
  },

  // Días festivos / cerrados
  holidays: [{
    date: Date,
    description: String
  }],

  // Tipos de cita habilitados para pacientes
  patientBookableTypes: {
    type: [String],
    default: ['checkup', 'cleaning', 'emergency', 'other']
  }

}, {
  timestamps: true
});

// Método para verificar si un horario está disponible
clinicSettingsSchema.methods.isTimeAvailable = function(date) {
  const dayOfWeek = date.getDay();
  const daySchedule = this.schedule[dayOfWeek];
  
  if (!daySchedule || !daySchedule.enabled) return false;
  
  const timeStr = date.toTimeString().slice(0, 5); // "HH:MM"
  
  for (const slot of daySchedule.slots) {
    if (timeStr >= slot.start && timeStr < slot.end) {
      return true;
    }
  }
  
  return false;
};

// Método para obtener horarios disponibles de un día
clinicSettingsSchema.methods.getAvailableSlots = function(date) {
  const dayOfWeek = date.getDay();
  const daySchedule = this.schedule[dayOfWeek];
  
  if (!daySchedule || !daySchedule.enabled) return [];
  
  const slots = [];
  const interval = this.appointmentInterval;
  
  for (const schedule of daySchedule.slots) {
    let [startHour, startMin] = schedule.start.split(':').map(Number);
    const [endHour, endMin] = schedule.end.split(':').map(Number);
    
    while (startHour < endHour || (startHour === endHour && startMin < endMin)) {
      const timeStr = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`;
      slots.push(timeStr);
      
      startMin += interval;
      if (startMin >= 60) {
        startHour += Math.floor(startMin / 60);
        startMin = startMin % 60;
      }
    }
  }
  
  return slots;
};

// Singleton - solo puede haber una configuración
clinicSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const ClinicSettings = mongoose.model('ClinicSettings', clinicSettingsSchema);

export default ClinicSettings;

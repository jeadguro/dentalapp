// src/utils/seed.js
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';

import User from '../models/User.js';
import Patient from '../models/Patient.js';
import Consultation from '../models/Consultation.js';
import Appointment from '../models/Appointment.js';

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const args = process.argv.slice(2);
    const shouldClear = args.includes('--clear');

    if (shouldClear) {
      console.log('🗑️  Limpiando datos existentes...');
      await User.deleteMany({});
      await Patient.deleteMany({});
      await Consultation.deleteMany({});
      await Appointment.deleteMany({});
    }

    // Crear admin
    console.log('👤 Creando usuarios...');
    let admin = await User.findOne({ email: 'admin@dentalcare.com' });
    if (!admin) {
      admin = await User.create({
        name: 'Dr. Administrador',
        email: 'admin@dentalcare.com',
        password: 'admin123',
        role: 'admin'
      });
      console.log('  ✅ Admin: admin@dentalcare.com / admin123');
    }

    let doctor = await User.findOne({ email: 'doctor@dentalcare.com' });
    if (!doctor) {
      doctor = await User.create({
        name: 'Dra. María García',
        email: 'doctor@dentalcare.com',
        password: 'doctor123',
        role: 'doctor'
      });
      console.log('  ✅ Doctor: doctor@dentalcare.com / doctor123');
    }

    // Crear pacientes
    console.log('👥 Creando pacientes...');
    const patientsData = [
      { name: 'Juan Pérez', email: 'juan@email.com', phone: '+52 555 111 1111', birthdate: new Date('1985-03-15') },
      { name: 'María González', email: 'maria@email.com', phone: '+52 555 222 2222', birthdate: new Date('1990-07-22') },
      { name: 'Carlos Rodríguez', email: 'carlos@email.com', phone: '+52 555 333 3333', birthdate: new Date('1978-11-08') },
      { name: 'Ana Martínez', email: 'ana@email.com', phone: '+52 555 444 4444', birthdate: new Date('1995-01-30') },
      { name: 'Roberto Hernández', email: 'roberto@email.com', phone: '+52 555 555 5555', birthdate: new Date('1982-09-12') }
    ];

    const patients = [];
    for (const data of patientsData) {
      let patient = await Patient.findOne({ email: data.email });
      if (!patient) {
        patient = await Patient.create(data);
        console.log(`  ✅ ${data.name} - Código: ${patient.accessCode}`);
      }
      patients.push(patient);
    }

    // Crear consultas
    console.log('📋 Creando consultas...');
    const consultations = [
      { patient: patients[0]._id, diagnosis: 'Caries molar', treatment: 'Empaste', date: new Date(Date.now() - 30*24*60*60*1000), attendedBy: doctor._id },
      { patient: patients[0]._id, diagnosis: 'Control', treatment: 'Revisión', date: new Date(Date.now() - 7*24*60*60*1000), attendedBy: doctor._id },
      { patient: patients[1]._id, diagnosis: 'Gingivitis', treatment: 'Limpieza profunda', date: new Date(Date.now() - 14*24*60*60*1000), attendedBy: doctor._id },
      { patient: patients[2]._id, diagnosis: 'Revisión general', treatment: 'Limpieza', date: new Date(Date.now() - 3*24*60*60*1000), attendedBy: admin._id }
    ];
    
    for (const c of consultations) {
      await Consultation.create(c);
    }
    console.log(`  ✅ ${consultations.length} consultas creadas`);

    // Crear citas
    console.log('📅 Creando citas...');
    const now = new Date();
    const appointments = [
      { patient: patients[0]._id, date: new Date(now.getTime() + 1*24*60*60*1000), type: 'checkup', status: 'pending', assignedTo: doctor._id },
      { patient: patients[1]._id, date: new Date(now.getTime() + 2*24*60*60*1000), type: 'cleaning', status: 'confirmed', assignedTo: doctor._id },
      { patient: patients[2]._id, date: new Date(now.getTime() + 3*24*60*60*1000), type: 'filling', status: 'pending', assignedTo: admin._id },
      { patient: patients[3]._id, date: new Date(now.getTime() + 4*24*60*60*1000), type: 'whitening', status: 'pending', assignedTo: doctor._id },
      { patient: patients[4]._id, date: new Date(now.getTime() - 2*24*60*60*1000), type: 'checkup', status: 'done', assignedTo: doctor._id }
    ];

    for (const a of appointments) {
      await Appointment.create(a);
    }
    console.log(`  ✅ ${appointments.length} citas creadas`);

    console.log('\n🎉 Seed completado!\n');
    console.log('Credenciales:');
    console.log('  Admin:  admin@dentalcare.com / admin123');
    console.log('  Doctor: doctor@dentalcare.com / doctor123\n');
    console.log('Códigos de pacientes:');
    patients.forEach(p => console.log(`  ${p.name}: ${p.accessCode}`));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

seed();

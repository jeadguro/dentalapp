// src/routes/authRoutes.js
import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { protect, staffOnly, patientOnly, adminOnly } from '../middleware/auth.js';
import {
  loginStaff,
  registerStaff,
  registerPatient,
  loginPatient,
  loginPatientByEmail,
  loginPatientByCode,
  loginPatientByToken,
  createPatientPassword,
  getMe,
  changePassword,
  changePatientPassword,
  getDoctors
} from '../controllers/authController.js';

const router = express.Router();

// Validaciones
const loginValidation = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('La contraseña es requerida')
];

const registerValidation = [
  body('name').trim().notEmpty().withMessage('El nombre es requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
];

const patientRegisterValidation = [
  body('name').trim().notEmpty().withMessage('El nombre es requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('phone').optional().trim()
];

// ========== RUTAS PÚBLICAS ==========

// Login staff (admin/doctor)
router.post('/login', loginValidation, validate, loginStaff);

// Lista de doctores (para pacientes)
router.get('/doctors', getDoctors);

// ========== RUTAS DE PACIENTES ==========

// Registro de paciente (auto-registro)
router.post('/patient/register', patientRegisterValidation, validate, registerPatient);

// Login de paciente con email y contraseña
router.post('/patient/login', loginValidation, validate, loginPatient);

// Login de paciente solo con email (legacy)
router.post('/patient/email', 
  body('email').isEmail().withMessage('Email inválido'),
  validate,
  loginPatientByEmail
);

// Login de paciente con código de acceso
router.post('/patient/code',
  body('code').trim().notEmpty().withMessage('El código es requerido'),
  validate,
  loginPatientByCode
);

// Login de paciente con token (QR/Link)
router.post('/patient/token',
  body('token').trim().notEmpty().withMessage('El token es requerido'),
  validate,
  loginPatientByToken
);

// Crear contraseña para paciente existente
router.post('/patient/create-password',
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  validate,
  createPatientPassword
);

// ========== RUTAS PROTEGIDAS ==========

// Obtener perfil actual
router.get('/me', protect, getMe);

// Solo admin puede registrar usuarios staff
router.post('/register', protect, staffOnly, adminOnly, registerValidation, validate, registerStaff);

// Cambiar contraseña (staff)
router.put('/password', protect, staffOnly, changePassword);

// Cambiar contraseña (paciente)
router.put('/patient/password', protect, patientOnly, changePatientPassword);

export default router;

// src/routes/authRoutes.js
import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { protect, staffOnly, adminOnly } from '../middleware/auth.js';
import {
  loginStaff,
  registerStaff,
  loginPatientByEmail,
  loginPatientByCode,
  loginPatientByToken,
  getMe,
  changePassword
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
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('role')
    .optional()
    .isIn(['admin', 'doctor'])
    .withMessage('Rol inválido')
];

// Rutas públicas
router.post('/login', loginValidation, validate, loginStaff);

// Login de pacientes (3 métodos)
router.post('/patient/email', 
  body('email').isEmail().withMessage('Email inválido'),
  validate,
  loginPatientByEmail
);

router.post('/patient/code',
  body('code').trim().notEmpty().withMessage('El código es requerido'),
  validate,
  loginPatientByCode
);

router.post('/patient/token',
  body('token').trim().notEmpty().withMessage('El token es requerido'),
  validate,
  loginPatientByToken
);

// Rutas protegidas
router.get('/me', protect, getMe);

// Solo admin puede registrar usuarios
router.post('/register', protect, staffOnly, adminOnly, registerValidation, validate, registerStaff);

// Cambiar contraseña (solo staff)
router.put('/password', protect, staffOnly, changePassword);

export default router;

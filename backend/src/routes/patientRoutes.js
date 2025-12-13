// src/routes/patientRoutes.js
import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { protect, staffOnly, patientOrStaff } from '../middleware/auth.js';
import {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
  getPatientHistory,
  getPatientQR,
  regenerateAccess,
  getPatientStats
} from '../controllers/patientController.js';

const router = express.Router();

// Validaciones
const patientValidation = [
  body('name').trim().notEmpty().withMessage('El nombre es requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('phone').optional().trim(),
  body('birthdate').optional().isISO8601().withMessage('Fecha de nacimiento inválida'),
  body('address').optional().trim(),
  body('notes').optional().trim()
];

const updateValidation = [
  body('name').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío'),
  body('email').optional().isEmail().withMessage('Email inválido'),
  body('phone').optional().trim(),
  body('birthdate').optional().isISO8601().withMessage('Fecha de nacimiento inválida'),
  body('address').optional().trim(),
  body('notes').optional().trim()
];

// Todas las rutas requieren autenticación
router.use(protect);

// Estadísticas (solo staff)
router.get('/stats', staffOnly, getPatientStats);

// CRUD de pacientes (solo staff)
router.get('/', staffOnly, getPatients);
router.post('/', staffOnly, patientValidation, validate, createPatient);
router.get('/:id', patientOrStaff, getPatient);
router.put('/:id', staffOnly, updateValidation, validate, updatePatient);
router.delete('/:id', staffOnly, deletePatient);

// Historial (paciente propio o staff)
router.get('/:id/history', patientOrStaff, getPatientHistory);

// QR y accesos (solo staff)
router.get('/:id/qr', staffOnly, getPatientQR);
router.post('/:id/regenerate-access', staffOnly, regenerateAccess);

export default router;

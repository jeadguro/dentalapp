// src/routes/appointmentRoutes.js
import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { protect, staffOnly, patientOnly } from '../middleware/auth.js';
import {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  completeAppointment,
  cancelAppointment,
  deleteAppointment,
  getTodayAppointments,
  getPendingAppointments,
  getAppointmentStats,
  getAppointmentTypes,
  createPatientAppointment,
  getMyAppointments,
  cancelMyAppointment
} from '../controllers/appointmentController.js';

const router = express.Router();

// Tipos de cita válidos
const validTypes = [
  'checkup', 'cleaning', 'filling', 'extraction', 'rootcanal',
  'crown', 'whitening', 'orthodontics', 'implant', 'emergency', 'other'
];

// Validaciones para staff
const appointmentValidation = [
  body('patient').isMongoId().withMessage('ID de paciente inválido'),
  body('date').isISO8601().withMessage('Fecha inválida'),
  body('type').isIn(validTypes).withMessage('Tipo de cita inválido'),
  body('doctor').isMongoId().withMessage('ID de doctor inválido'),
  body('notes').optional().trim()
];

// Validaciones para pacientes
const patientAppointmentValidation = [
  body('date').isISO8601().withMessage('Fecha inválida'),
  body('type').isIn(validTypes).withMessage('Tipo de cita inválido'),
  body('doctorId').isMongoId().withMessage('ID de doctor inválido'),
  body('notes').optional().trim().isLength({ max: 200 }).withMessage('Notas máximo 200 caracteres')
];

const updateValidation = [
  body('date').optional().isISO8601().withMessage('Fecha inválida'),
  body('type').optional().isIn(validTypes).withMessage('Tipo de cita inválido'),
  body('status').optional().isIn(['pending', 'confirmed', 'in-progress', 'done', 'cancelled', 'no-show']),
  body('notes').optional().trim()
];

// ========== RUTAS PÚBLICAS ==========
router.get('/types', getAppointmentTypes);

// ========== RUTAS PROTEGIDAS ==========
router.use(protect);

// ========== RUTAS PARA PACIENTES ==========
// Obtener mis citas
router.get('/my', patientOnly, getMyAppointments);

// Crear cita (paciente)
router.post('/book', patientOnly, patientAppointmentValidation, validate, createPatientAppointment);

// Cancelar mi cita
router.put('/my/:id/cancel', patientOnly, cancelMyAppointment);

// ========== RUTAS PARA STAFF ==========
// Estadísticas y citas especiales
router.get('/stats', staffOnly, getAppointmentStats);
router.get('/today', staffOnly, getTodayAppointments);
router.get('/pending', staffOnly, getPendingAppointments);

// CRUD de citas
router.get('/', staffOnly, getAppointments);
router.post('/', staffOnly, appointmentValidation, validate, createAppointment);
router.get('/:id', getAppointment);
router.put('/:id', staffOnly, updateValidation, validate, updateAppointment);
router.delete('/:id', staffOnly, deleteAppointment);

// Acciones rápidas
router.put('/:id/complete', staffOnly, completeAppointment);
router.put('/:id/cancel', staffOnly, cancelAppointment);

export default router;

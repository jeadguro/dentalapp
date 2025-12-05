// src/routes/appointmentRoutes.js
import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { protect, staffOnly } from '../middleware/auth.js';
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
  getAppointmentTypes
} from '../controllers/appointmentController.js';

const router = express.Router();

// Tipos de cita válidos
const validTypes = [
  'checkup', 'cleaning', 'filling', 'extraction', 'rootcanal',
  'crown', 'whitening', 'orthodontics', 'implant', 'emergency', 'other'
];

// Validaciones
const appointmentValidation = [
  body('patient').isMongoId().withMessage('ID de paciente inválido'),
  body('date').isISO8601().withMessage('Fecha inválida'),
  body('type').isIn(validTypes).withMessage('Tipo de cita inválido'),
  body('notes').optional().trim()
];

const updateValidation = [
  body('date').optional().isISO8601().withMessage('Fecha inválida'),
  body('type').optional().isIn(validTypes).withMessage('Tipo de cita inválido'),
  body('status').optional().isIn(['pending', 'confirmed', 'in-progress', 'done', 'cancelled', 'no-show']),
  body('notes').optional().trim()
];

// Ruta pública para obtener tipos
router.get('/types', getAppointmentTypes);

// Todas las demás rutas requieren autenticación
router.use(protect);

// Estadísticas y citas especiales (solo staff)
router.get('/stats', staffOnly, getAppointmentStats);
router.get('/today', staffOnly, getTodayAppointments);
router.get('/pending', staffOnly, getPendingAppointments);

// CRUD de citas
router.get('/', staffOnly, getAppointments);
router.post('/', staffOnly, appointmentValidation, validate, createAppointment);
router.get('/:id', getAppointment); // Paciente puede ver sus propias citas
router.put('/:id', staffOnly, updateValidation, validate, updateAppointment);
router.delete('/:id', staffOnly, deleteAppointment);

// Acciones rápidas
router.put('/:id/complete', staffOnly, completeAppointment);
router.put('/:id/cancel', staffOnly, cancelAppointment);

export default router;

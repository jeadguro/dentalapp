// src/routes/consultationRoutes.js
import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { protect, staffOnly } from '../middleware/auth.js';
import { upload } from '../config/cloudinary.js';
import {
  getConsultations,
  getConsultation,
  createConsultation,
  updateConsultation,
  deleteConsultation,
  uploadPhotos,
  deletePhoto,
  getTodayConsultations,
  getConsultationStats
} from '../controllers/consultationController.js';

const router = express.Router();

// Validaciones
const consultationValidation = [
  body('patient').isMongoId().withMessage('ID de paciente inválido'),
  body('diagnosis').trim().notEmpty().withMessage('El diagnóstico es requerido'),
  body('date').optional().isISO8601().withMessage('Fecha inválida'),
  body('treatment').optional().trim(),
  body('notes').optional().trim(),
  body('cost').optional().isNumeric().withMessage('El costo debe ser un número'),
  body('paymentStatus').optional().isIn(['pending', 'partial', 'paid']).withMessage('Estado de pago inválido')
];

const updateValidation = [
  body('diagnosis').optional().trim().notEmpty().withMessage('El diagnóstico no puede estar vacío'),
  body('date').optional().isISO8601().withMessage('Fecha inválida'),
  body('treatment').optional().trim(),
  body('notes').optional().trim(),
  body('cost').optional().isNumeric().withMessage('El costo debe ser un número'),
  body('paymentStatus').optional().isIn(['pending', 'partial', 'paid']).withMessage('Estado de pago inválido')
];

// Todas las rutas requieren autenticación
router.use(protect);

// Estadísticas y consultas de hoy (solo staff)
router.get('/stats', staffOnly, getConsultationStats);
router.get('/today', staffOnly, getTodayConsultations);

// CRUD de consultas
router.get('/', staffOnly, getConsultations);
router.post('/', staffOnly, consultationValidation, validate, createConsultation);
router.get('/:id', getConsultation); // Paciente puede ver sus propias consultas
router.put('/:id', staffOnly, updateValidation, validate, updateConsultation);
router.delete('/:id', staffOnly, deleteConsultation);

// Fotos (solo staff)
router.post('/:id/photos', staffOnly, upload.array('photos', 10), uploadPhotos);
router.delete('/:id/photos/:photoId', staffOnly, deletePhoto);

export default router;

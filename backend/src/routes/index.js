// src/routes/index.js
import express from 'express';
import authRoutes from './authRoutes.js';
import patientRoutes from './patientRoutes.js';
import consultationRoutes from './consultationRoutes.js';
import appointmentRoutes from './appointmentRoutes.js';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Rutas de la API
router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
router.use('/consultations', consultationRoutes);
router.use('/appointments', appointmentRoutes);

export default router;

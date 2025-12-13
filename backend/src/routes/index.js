// src/routes/index.js
import express from 'express';
import authRoutes from './authRoutes.js';
import patientRoutes from './patientRoutes.js';
import consultationRoutes from './consultationRoutes.js';
import appointmentRoutes from './appointmentRoutes.js';
import settingsRoutes from './settingsRoutes.js';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'DentalCare Pro API v2.0',
    timestamp: new Date().toISOString()
  });
});

// Rutas de la API
router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
router.use('/consultations', consultationRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/settings', settingsRoutes);

export default router;

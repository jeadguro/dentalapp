// src/server.js
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import connectDB from './config/database.js';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/validate.js';

// Cargar variables de entorno

// Conectar a la base de datos
connectDB();

const app = express();

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging en desarrollo
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🦷 DentalCare API',
    version: '1.0.0',
    docs: '/api/health'
  });
});

// Rutas de la API
app.use('/api', routes);

// Manejo de errores
app.use(notFound);
app.use(errorHandler);

// Iniciar servidor
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
  🦷 ================================== 🦷
     DentalCare API Server
     Puerto: ${PORT}
     Entorno: ${process.env.NODE_ENV || 'development'}
     URL: http://localhost:${PORT}
  🦷 ================================== 🦷
  `);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  console.error('❌ Error no manejado:', err.message);
  // En producción, podrías querer cerrar el servidor gracefully
});

export default app;

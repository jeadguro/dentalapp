// src/middleware/auth.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Patient from '../models/Patient.js';

// Verificar token JWT
export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado. Token no proporcionado.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type === 'patient') {
      const patient = await Patient.findById(decoded.id);
      if (!patient || !patient.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Paciente no encontrado o inactivo.'
        });
      }
      req.patient = patient;
      req.userType = 'patient';
    } else {
      const user = await User.findById(decoded.id);
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no encontrado o inactivo.'
        });
      }
      req.user = user;
      req.userType = 'staff';
    }

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido.'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado.'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Error de autenticación.'
    });
  }
};

// Solo staff (admin o doctor)
export const staffOnly = (req, res, next) => {
  if (req.userType !== 'staff') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Solo personal autorizado.'
    });
  }
  next();
};

// Solo admin
export const adminOnly = (req, res, next) => {
  if (req.userType !== 'staff' || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Solo administradores.'
    });
  }
  next();
};

// Solo pacientes
export const patientOnly = (req, res, next) => {
  if (req.userType !== 'patient') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Solo pacientes.'
    });
  }
  next();
};

// Solo el paciente dueño del recurso o staff
export const patientOrStaff = (req, res, next) => {
  if (req.userType === 'staff') {
    return next();
  }
  
  const patientId = req.params.patientId || req.params.id;
  if (req.patient && req.patient._id.toString() === patientId) {
    return next();
  }
  
  return res.status(403).json({
    success: false,
    message: 'Acceso denegado.'
  });
};

// Generar token JWT
export const generateToken = (id, type = 'staff') => {
  return jwt.sign(
    { id, type },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

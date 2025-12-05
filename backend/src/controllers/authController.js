// src/controllers/authController.js
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import { generateToken } from '../middleware/auth.js';

// @desc    Login de staff (admin/doctor)
// @route   POST /api/auth/login
// @access  Public
export const loginStaff = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validar campos
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }

    // Buscar usuario con contraseña
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Verificar si está activo
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Usuario desactivado. Contacta al administrador.'
      });
    }

    // Verificar contraseña
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Generar token
    const token = generateToken(user._id, 'staff');

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: user.toPublicJSON(),
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Registro de staff (solo admin puede crear)
// @route   POST /api/auth/register
// @access  Private/Admin
export const registerStaff = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // Verificar si el email ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // Crear usuario
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'doctor',
      phone
    });

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: {
        user: user.toPublicJSON()
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login de paciente con email
// @route   POST /api/auth/patient/email
// @access  Public
export const loginPatientByEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'El email es requerido'
      });
    }

    const patient = await Patient.findOne({ email, isActive: true });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró un paciente con ese email'
      });
    }

    // Actualizar último acceso
    patient.lastAccess = new Date();
    await patient.save();

    // Generar token
    const token = generateToken(patient._id, 'patient');

    res.json({
      success: true,
      message: 'Acceso exitoso',
      data: {
        patient: patient.toPortalJSON(),
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login de paciente con código de acceso
// @route   POST /api/auth/patient/code
// @access  Public
export const loginPatientByCode = async (req, res, next) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'El código es requerido'
      });
    }

    const patient = await Patient.findOne({ 
      accessCode: code.toUpperCase(), 
      isActive: true 
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Código de acceso inválido'
      });
    }

    // Actualizar último acceso
    patient.lastAccess = new Date();
    await patient.save();

    // Generar token
    const token = generateToken(patient._id, 'patient');

    res.json({
      success: true,
      message: 'Acceso exitoso',
      data: {
        patient: patient.toPortalJSON(),
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login de paciente con token (QR/Link)
// @route   POST /api/auth/patient/token
// @access  Public
export const loginPatientByToken = async (req, res, next) => {
  try {
    const { token: accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: 'El token es requerido'
      });
    }

    const patient = await Patient.findOne({ 
      accessToken, 
      isActive: true 
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Token de acceso inválido'
      });
    }

    // Actualizar último acceso
    patient.lastAccess = new Date();
    await patient.save();

    // Generar token JWT
    const token = generateToken(patient._id, 'patient');

    res.json({
      success: true,
      message: 'Acceso exitoso',
      data: {
        patient: patient.toPortalJSON(),
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener perfil actual
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    if (req.userType === 'patient') {
      res.json({
        success: true,
        data: {
          type: 'patient',
          profile: req.patient.toPortalJSON()
        }
      });
    } else {
      res.json({
        success: true,
        data: {
          type: 'staff',
          profile: req.user.toPublicJSON()
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Cambiar contraseña (staff)
// @route   PUT /api/auth/password
// @access  Private/Staff
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña actual y nueva son requeridas'
      });
    }

    const user = await User.findById(req.user._id).select('+password');

    // Verificar contraseña actual
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña actual incorrecta'
      });
    }

    // Actualizar contraseña
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

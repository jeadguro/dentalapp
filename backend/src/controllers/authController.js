// src/controllers/authController.js
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import { generateToken } from '../middleware/auth.js';
import crypto from 'crypto';

// @desc    Login de staff (admin/doctor)
// @route   POST /api/auth/login
// @access  Public
export const loginStaff = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Usuario desactivado. Contacta al administrador.'
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

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
    const { name, email, password, role, phone, specialty, licenseNumber } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'doctor',
      phone,
      specialty,
      licenseNumber
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

// @desc    Registro de paciente (auto-registro)
// @route   POST /api/auth/patient/register
// @access  Public
export const registerPatient = async (req, res, next) => {
  try {
    const { name, email, password, phone, birthdate, gender } = req.body;

    // Verificar campos requeridos
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, email y contraseña son requeridos'
      });
    }

    // Verificar si el email ya existe
    const existingPatient = await Patient.findOne({ email });
    if (existingPatient) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // Crear paciente
    const patient = await Patient.create({
      name,
      email,
      password,
      phone,
      birthdate,
      gender,
      selfRegistered: true,
      emailVerified: false
    });

    // Generar token de verificación de email (opcional para después)
    // const verificationToken = patient.generateEmailVerificationToken();
    // await patient.save();

    // Generar token JWT
    const token = generateToken(patient._id, 'patient');

    res.status(201).json({
      success: true,
      message: 'Registro exitoso. ¡Bienvenido!',
      data: {
        patient: patient.toPortalJSON(),
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login de paciente con email y contraseña
// @route   POST /api/auth/patient/login
// @access  Public
export const loginPatient = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }

    const patient = await Patient.findOne({ email, isActive: true }).select('+password');

    if (!patient) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Si el paciente no tiene contraseña (fue creado por la clínica)
    if (!patient.password) {
      return res.status(400).json({
        success: false,
        message: 'Debes crear una contraseña primero. Usa tu código de acceso.'
      });
    }

    const isMatch = await patient.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    patient.lastAccess = new Date();
    await patient.save();

    const token = generateToken(patient._id, 'patient');

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        patient: patient.toPortalJSON(),
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login de paciente con email (sin contraseña - legacy)
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

    patient.lastAccess = new Date();
    await patient.save();

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

    patient.lastAccess = new Date();
    await patient.save();

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

    patient.lastAccess = new Date();
    await patient.save();

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

// @desc    Crear contraseña para paciente existente
// @route   POST /api/auth/patient/create-password
// @access  Public (requiere código de acceso)
export const createPatientPassword = async (req, res, next) => {
  try {
    const { code, email, password } = req.body;

    if ((!code && !email) || !password) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere código o email, y la nueva contraseña'
      });
    }

    let patient;
    if (code) {
      patient = await Patient.findOne({ accessCode: code.toUpperCase(), isActive: true });
    } else {
      patient = await Patient.findOne({ email, isActive: true });
    }

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    patient.password = password;
    patient.selfRegistered = false;
    await patient.save();

    const token = generateToken(patient._id, 'patient');

    res.json({
      success: true,
      message: 'Contraseña creada exitosamente',
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

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña actual incorrecta'
      });
    }

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

// @desc    Cambiar contraseña (paciente)
// @route   PUT /api/auth/patient/password
// @access  Private/Patient
export const changePatientPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña actual y nueva son requeridas'
      });
    }

    const patient = await Patient.findById(req.patient._id).select('+password');

    if (patient.password) {
      const isMatch = await patient.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Contraseña actual incorrecta'
        });
      }
    }

    patient.password = newPassword;
    await patient.save();

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener lista de doctores (para pacientes al agendar)
// @route   GET /api/auth/doctors
// @access  Public
export const getDoctors = async (req, res, next) => {
  try {
    const doctors = await User.find({ 
      role: { $in: ['doctor', 'admin'] }, 
      isActive: true 
    }).select('name specialty avatar');

    res.json({
      success: true,
      data: doctors
    });
  } catch (error) {
    next(error);
  }
};

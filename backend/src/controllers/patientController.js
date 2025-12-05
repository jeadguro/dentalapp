// src/controllers/patientController.js
import Patient from '../models/Patient.js';
import Consultation from '../models/Consultation.js';
import Appointment from '../models/Appointment.js';
import QRCode from 'qrcode';

// @desc    Obtener todos los pacientes
// @route   GET /api/patients
// @access  Private/Staff
export const getPatients = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 50, sort = '-createdAt' } = req.query;
    
    let query = { isActive: true };
    
    // Búsqueda por nombre o email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const patients = await Patient.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Patient.countDocuments(query);

    res.json({
      success: true,
      data: {
        patients,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener un paciente por ID
// @route   GET /api/patients/:id
// @access  Private
export const getPatient = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    res.json({
      success: true,
      data: { patient }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Crear paciente
// @route   POST /api/patients
// @access  Private/Staff
export const createPatient = async (req, res, next) => {
  try {
    const { name, email, phone, birthdate, address, notes } = req.body;

    // Verificar si el email ya existe
    const existingPatient = await Patient.findOne({ email });
    if (existingPatient) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un paciente con ese email'
      });
    }

    const patient = await Patient.create({
      name,
      email,
      phone,
      birthdate,
      address,
      notes
    });

    res.status(201).json({
      success: true,
      message: 'Paciente creado exitosamente',
      data: { patient }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Actualizar paciente
// @route   PUT /api/patients/:id
// @access  Private/Staff
export const updatePatient = async (req, res, next) => {
  try {
    const { name, email, phone, birthdate, address, notes } = req.body;

    // Si cambia el email, verificar que no exista
    if (email) {
      const existingPatient = await Patient.findOne({ 
        email, 
        _id: { $ne: req.params.id } 
      });
      if (existingPatient) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un paciente con ese email'
        });
      }
    }

    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { name, email, phone, birthdate, address, notes },
      { new: true, runValidators: true }
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Paciente actualizado exitosamente',
      data: { patient }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Eliminar paciente (soft delete)
// @route   DELETE /api/patients/:id
// @access  Private/Staff
export const deletePatient = async (req, res, next) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Paciente eliminado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener historial completo del paciente
// @route   GET /api/patients/:id/history
// @access  Private
export const getPatientHistory = async (req, res, next) => {
  try {
    const patientId = req.params.id;

    // Verificar acceso (si es paciente, solo puede ver su propio historial)
    if (req.userType === 'patient' && req.patient._id.toString() !== patientId) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado'
      });
    }

    const [patient, consultations, appointments] = await Promise.all([
      Patient.findById(patientId),
      Consultation.find({ patient: patientId }).sort('-date').setOptions({ _skipPopulate: true }),
      Appointment.find({ patient: patientId }).sort('-date').setOptions({ _skipPopulate: true })
    ]);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        patient: req.userType === 'patient' ? patient.toPortalJSON() : patient,
        consultations,
        appointments,
        stats: {
          totalConsultations: consultations.length,
          totalAppointments: appointments.length,
          totalPhotos: consultations.reduce((acc, c) => acc + (c.photos?.length || 0), 0),
          pendingAppointments: appointments.filter(a => a.status === 'pending').length
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generar QR de acceso del paciente
// @route   GET /api/patients/:id/qr
// @access  Private/Staff
export const getPatientQR = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    // URL de acceso directo
    const accessUrl = `${process.env.FRONTEND_URL}/patient-access/${patient.accessToken}`;

    // Generar QR como data URL
    const qrDataUrl = await QRCode.toDataURL(accessUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#115e59', // Color dental
        light: '#ffffff'
      }
    });

    res.json({
      success: true,
      data: {
        patient: {
          id: patient._id,
          name: patient.name,
          accessCode: patient.accessCode
        },
        qr: qrDataUrl,
        accessUrl,
        accessCode: patient.accessCode
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Regenerar código de acceso del paciente
// @route   POST /api/patients/:id/regenerate-access
// @access  Private/Staff
export const regenerateAccess = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    const { accessCode, accessToken } = await patient.regenerateAccessCode();

    // Generar nuevo QR
    const accessUrl = `${process.env.FRONTEND_URL}/patient-access/${accessToken}`;
    const qrDataUrl = await QRCode.toDataURL(accessUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#115e59',
        light: '#ffffff'
      }
    });

    res.json({
      success: true,
      message: 'Código de acceso regenerado exitosamente',
      data: {
        accessCode,
        qr: qrDataUrl,
        accessUrl
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener estadísticas de pacientes
// @route   GET /api/patients/stats
// @access  Private/Staff
export const getPatientStats = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, newThisMonth] = await Promise.all([
      Patient.countDocuments({ isActive: true }),
      Patient.countDocuments({ 
        isActive: true, 
        createdAt: { $gte: startOfMonth } 
      })
    ]);

    res.json({
      success: true,
      data: {
        total,
        newThisMonth
      }
    });
  } catch (error) {
    next(error);
  }
};

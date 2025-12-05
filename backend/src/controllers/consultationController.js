// src/controllers/consultationController.js
import Consultation from '../models/Consultation.js';
import Patient from '../models/Patient.js';
import { deleteImage } from '../config/cloudinary.js';

// @desc    Obtener todas las consultas
// @route   GET /api/consultations
// @access  Private/Staff
export const getConsultations = async (req, res, next) => {
  try {
    const { patient, page = 1, limit = 50, sort = '-date' } = req.query;
    
    let query = {};
    
    if (patient) {
      query.patient = patient;
    }

    const consultations = await Consultation.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Consultation.countDocuments(query);

    res.json({
      success: true,
      data: {
        consultations,
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

// @desc    Obtener una consulta por ID
// @route   GET /api/consultations/:id
// @access  Private
export const getConsultation = async (req, res, next) => {
  try {
    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consulta no encontrada'
      });
    }

    // Verificar acceso si es paciente
    if (req.userType === 'patient') {
      if (consultation.patient._id.toString() !== req.patient._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado'
        });
      }
    }

    res.json({
      success: true,
      data: { consultation }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Crear consulta
// @route   POST /api/consultations
// @access  Private/Staff
export const createConsultation = async (req, res, next) => {
  try {
    const { 
      patient: patientId, 
      date, 
      diagnosis, 
      treatment, 
      notes,
      procedures,
      cost,
      paymentStatus,
      nextAppointmentRecommended
    } = req.body;

    // Verificar que el paciente existe
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    const consultation = await Consultation.create({
      patient: patientId,
      date: date || new Date(),
      diagnosis,
      treatment,
      notes,
      procedures,
      cost,
      paymentStatus,
      nextAppointmentRecommended,
      attendedBy: req.user._id
    });

    await consultation.populate('patient', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Consulta registrada exitosamente',
      data: { consultation }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Actualizar consulta
// @route   PUT /api/consultations/:id
// @access  Private/Staff
export const updateConsultation = async (req, res, next) => {
  try {
    const { 
      date, 
      diagnosis, 
      treatment, 
      notes,
      procedures,
      cost,
      paymentStatus,
      nextAppointmentRecommended
    } = req.body;

    const consultation = await Consultation.findByIdAndUpdate(
      req.params.id,
      { 
        date, 
        diagnosis, 
        treatment, 
        notes,
        procedures,
        cost,
        paymentStatus,
        nextAppointmentRecommended
      },
      { new: true, runValidators: true }
    );

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consulta no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Consulta actualizada exitosamente',
      data: { consultation }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Eliminar consulta
// @route   DELETE /api/consultations/:id
// @access  Private/Staff
export const deleteConsultation = async (req, res, next) => {
  try {
    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consulta no encontrada'
      });
    }

    // Eliminar fotos de Cloudinary
    if (consultation.photos && consultation.photos.length > 0) {
      for (const photo of consultation.photos) {
        if (photo.publicId) {
          try {
            await deleteImage(photo.publicId);
          } catch (err) {
            console.warn('Error eliminando foto de Cloudinary:', err);
          }
        }
      }
    }

    await consultation.deleteOne();

    res.json({
      success: true,
      message: 'Consulta eliminada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Subir fotos a una consulta
// @route   POST /api/consultations/:id/photos
// @access  Private/Staff
export const uploadPhotos = async (req, res, next) => {
  try {
    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consulta no encontrada'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionaron archivos'
      });
    }

    // FIX: Cloudinary usa file.public_id, NO file.filename
    const newPhotos = req.files.map(file => ({
      url: file.path,          // URL en Cloudinary
      publicId: file.public_id, // public_id correcto
      description: req.body.description || '',
      uploadedAt: new Date()
    }));

    consultation.photos.push(...newPhotos);
    await consultation.save();

    res.json({
      success: true,
      message: `${newPhotos.length} foto(s) subida(s) exitosamente`,
      data: { 
        photos: consultation.photos,
        newPhotos 
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Eliminar foto de una consulta
// @route   DELETE /api/consultations/:id/photos/:photoId
// @access  Private/Staff
export const deletePhoto = async (req, res, next) => {
  try {
    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consulta no encontrada'
      });
    }

    const photoIndex = consultation.photos.findIndex(
      p => p._id.toString() === req.params.photoId
    );

    if (photoIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Foto no encontrada'
      });
    }

    const photo = consultation.photos[photoIndex];

    // Eliminar de Cloudinary
    if (photo.publicId) {
      try {
        await deleteImage(photo.publicId);
      } catch (err) {
        console.warn('Error eliminando de Cloudinary:', err);
      }
    }

    consultation.photos.splice(photoIndex, 1);
    await consultation.save();

    res.json({
      success: true,
      message: 'Foto eliminada exitosamente',
      data: { photos: consultation.photos }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener consultas de hoy
// @route   GET /api/consultations/today
// @access  Private/Staff
export const getTodayConsultations = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const consultations = await Consultation.find({
      date: { $gte: today, $lt: tomorrow }
    }).sort('date');

    res.json({
      success: true,
      data: { consultations }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener estadísticas de consultas
// @route   GET /api/consultations/stats
// @access  Private/Staff
export const getConsultationStats = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const [total, thisMonth, today] = await Promise.all([
      Consultation.countDocuments(),
      Consultation.countDocuments({ date: { $gte: startOfMonth } }),
      Consultation.countDocuments({ date: { $gte: startOfDay, $lt: endOfDay } })
    ]);

    res.json({
      success: true,
      data: {
        total,
        thisMonth,
        today
      }
    });
  } catch (error) {
    next(error);
  }
};

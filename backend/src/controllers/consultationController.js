// src/controllers/consultationController.js
import Consultation from '../models/Consultation.js';
import Patient from '../models/Patient.js';
import { deleteImage } from '../config/cloudinary.js';

// =======================
// GET ALL CONSULTATIONS
// =======================
export const getConsultations = async (req, res, next) => {
  try {
    const { patient, page = 1, limit = 50, sort = '-date' } = req.query;

    let query = {};
    if (patient) query.patient = patient;

    const consultations = await Consultation.find(query)
      .populate('patient', 'name email phone photo')
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

// =======================
// GET CONSULTATION BY ID
// =======================
export const getConsultation = async (req, res, next) => {
  try {
    const consultation = await Consultation.findById(req.params.id)
      .populate('patient', 'name email phone photo');

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consulta no encontrada'
      });
    }

    // Si el usuario es paciente, validar que sea su consulta
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

// =======================
// CREATE CONSULTATION
// =======================
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
      nextAppointmentRecommended,
      odontogram // 🔵 Nuevo campo
    } = req.body;

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
      odontogram: odontogram || [], // 🔵 Array de dientes seleccionados
      attendedBy: req.user._id
    });

    await consultation.populate('patient', 'name email phone photo');

    res.status(201).json({
      success: true,
      message: 'Consulta registrada exitosamente',
      data: { consultation }
    });

  } catch (error) {
    next(error);
  }
};

// =======================
// UPDATE CONSULTATION
// =======================
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
      nextAppointmentRecommended,
      odontogram // 🔵 Nuevo
    } = req.body;

    const updates = {
      date,
      diagnosis,
      treatment,
      notes,
      procedures,
      cost,
      paymentStatus,
      nextAppointmentRecommended
    };

    if (odontogram) {
      updates.odontogram = odontogram; // 🔵 Actualiza odontograma
    }

    const consultation = await Consultation.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('patient', 'name email phone photo');

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

// =======================
// DELETE CONSULTATION
// =======================
export const deleteConsultation = async (req, res, next) => {
  try {
    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consulta no encontrada'
      });
    }

    // Eliminar fotos Cloudinary
    if (consultation.photos?.length > 0) {
      for (const photo of consultation.photos) {
        if (photo.publicId) {
          try { await deleteImage(photo.publicId); } catch {}
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

// =======================
// UPLOAD PHOTOS
// =======================
export const uploadPhotos = async (req, res, next) => {
  try {
    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consulta no encontrada'
      });
    }

    if (!req.files?.length) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionaron archivos'
      });
    }

    const newPhotos = req.files.map(file => ({
      url: file.path,
      publicId: file.public_id,
      description: req.body.description || '',
      uploadedAt: new Date()
    }));

    consultation.photos.push(...newPhotos);
    await consultation.save();

    res.json({
      success: true,
      message: `${newPhotos.length} foto(s) subida(s)`,
      data: { photos: consultation.photos, newPhotos }
    });

  } catch (error) {
    next(error);
  }
};

// =======================
// DELETE PHOTO
// =======================
export const deletePhoto = async (req, res, next) => {
  try {
    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      return res.status(404).json({ success: false, message: 'Consulta no encontrada' });
    }

    const photoIndex = consultation.photos.findIndex(
      p => p._id.toString() === req.params.photoId
    );

    if (photoIndex === -1) {
      return res.status(404).json({ success: false, message: 'Foto no encontrada' });
    }

    const photo = consultation.photos[photoIndex];
    if (photo.publicId) await deleteImage(photo.publicId);

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

// =======================
// TODAY CONSULTATIONS
// =======================
export const getTodayConsultations = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const consultations = await Consultation.find({
      date: { $gte: today, $lt: tomorrow }
    }).populate('patient', 'name photo');

    res.json({
      success: true,
      data: { consultations }
    });

  } catch (error) {
    next(error);
  }
};

// =======================
// STATS
// =======================
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
      data: { total, thisMonth, today }
    });

  } catch (error) {
    next(error);
  }
};

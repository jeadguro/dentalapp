// src/config/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Cargar variables de entorno
import dotenv from 'dotenv';
dotenv.config();

// Configurar Cloudinary con .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage para multer + Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'dental-clinic',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 1200, height: 1200, crop: 'limit' },
      { quality: 'auto' },
    ],
  },
});

// Filtro opcional
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  allowed.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error('Formato no permitido'), false);
};

// Exportar Multer
export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Eliminar imagen
export const deleteImage = async (publicId) => {
  return await cloudinary.uploader.destroy(publicId);
};

// Extraer publicId desde URL (función auxiliar)
export const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  const parts = url.split('/');
  const filename = parts.pop();
  const folder = parts.pop();
  return `${folder}/${filename.split('.')[0]}`;
};

export default cloudinary;

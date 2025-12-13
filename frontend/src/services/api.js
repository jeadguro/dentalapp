// src/services/api.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Interceptor para agregar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejo de errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isPatient = localStorage.getItem('userType') === 'patient';
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userType');
      window.location.href = isPatient ? '/portal/login' : '/admin/login';
    }
    return Promise.reject(error);
  }
);

/* -------------------------------
 🔹 AUTH - STAFF (Admin/Doctor)
--------------------------------*/
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/password', data),
  getDoctors: () => api.get('/auth/doctors'),
};

/* -------------------------------
 🔹 AUTH - PACIENTES
--------------------------------*/
export const patientAuthAPI = {
  // Registro (nuevo)
  register: (data) => api.post('/auth/patient/register', data),
  
  // Login con email y password
  login: (data) => api.post('/auth/patient/login', data),
  
  // Login legacy (sin password)
  loginByEmail: (email) => api.post('/auth/patient/email', { email }),
  loginByCode: (code) => api.post('/auth/patient/code', { code }),
  loginByToken: (token) => api.post('/auth/patient/token', { token }),
  
  // Crear password para paciente existente
  createPassword: (data) => api.post('/auth/patient/create-password', data),
  
  // Cambiar password
  changePassword: (data) => api.put('/auth/patient/password', data),
};

/* -------------------------------
 🔹 SETTINGS (Configuración clínica)
--------------------------------*/
export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
  getAvailableSlots: (date, doctorId) => 
    api.get('/settings/available-slots', { params: { date, doctorId } }),
  getAppointmentTypes: () => api.get('/settings/appointment-types'),
};

/* -------------------------------
 🔹 PATIENTS
--------------------------------*/
export const patientsAPI = {
  getAll: (params) => api.get('/patients', { params }),
  getOne: (id) => api.get(`/patients/${id}`),
  create: (data) => api.post('/patients', data),
  update: (id, data) => api.put(`/patients/${id}`, data),
  delete: (id) => api.delete(`/patients/${id}`),
  getHistory: (id) => api.get(`/patients/${id}/history`),
  getQR: (id) => api.get(`/patients/${id}/qr`),
  regenerateAccess: (id) => api.post(`/patients/${id}/regenerate-access`),
  getStats: () => api.get('/patients/stats'),
};

/* -------------------------------
 🔹 CONSULTATIONS
--------------------------------*/
export const consultationsAPI = {
  getAll: (params) => api.get('/consultations', { params }),
  getOne: (id) => api.get(`/consultations/${id}`),
  create: (data) => api.post('/consultations', data),
  update: (id, data) => api.put(`/consultations/${id}`, data),
  delete: (id) => api.delete(`/consultations/${id}`),
  uploadPhotos: (id, formData) =>
    api.post(`/consultations/${id}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  deletePhoto: (consultationId, photoId) =>
    api.delete(`/consultations/${consultationId}/photos/${photoId}`),
  getToday: () => api.get('/consultations/today'),
  getStats: () => api.get('/consultations/stats'),
};

/* -------------------------------
 🔹 APPOINTMENTS - STAFF
--------------------------------*/
export const appointmentsAPI = {
  getAll: (params) => api.get('/appointments', { params }),
  getOne: (id) => api.get(`/appointments/${id}`),
  create: (data) => api.post('/appointments', data),
  update: (id, data) => api.put(`/appointments/${id}`, data),
  delete: (id) => api.delete(`/appointments/${id}`),
  complete: (id) => api.put(`/appointments/${id}/complete`),
  cancel: (id, reason) => api.put(`/appointments/${id}/cancel`, { reason }),
  getToday: () => api.get('/appointments/today'),
  getPending: () => api.get('/appointments/pending'),
  getStats: () => api.get('/appointments/stats'),
  getTypes: () => api.get('/appointments/types'),
};

/* -------------------------------
 🔹 APPOINTMENTS - PACIENTE
--------------------------------*/
export const patientAppointmentsAPI = {
  // Obtener mis citas
  getMy: (params) => api.get('/appointments/my', { params }),
  
  // Agendar cita
  book: (data) => api.post('/appointments/book', data),
  
  // Cancelar mi cita
  cancel: (id, reason) => api.put(`/appointments/my/${id}/cancel`, { reason }),
};

export default api;

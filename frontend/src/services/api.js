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

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  patientLoginEmail: (email) => api.post('/auth/patient/email', { email }),
  patientLoginCode: (code) => api.post('/auth/patient/code', { code }),
  patientLoginToken: (token) => api.post('/auth/patient/token', { token }),
};

// Patients
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

// Consultations
export const consultationsAPI = {
  getAll: (params) => api.get('/consultations', { params }),
  getOne: (id) => api.get(`/consultations/${id}`),
  create: (data) => api.post('/consultations', data),
  update: (id, data) => api.put(`/consultations/${id}`, data),
  delete: (id) => api.delete(`/consultations/${id}`),
  uploadPhotos: (id, formData) => api.post(`/consultations/${id}/photos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deletePhoto: (consultationId, photoId) => api.delete(`/consultations/${consultationId}/photos/${photoId}`),
  getToday: () => api.get('/consultations/today'),
  getStats: () => api.get('/consultations/stats'),
};

// Appointments
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

export default api;

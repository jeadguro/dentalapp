// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { StaffRoute, PatientRoute, PublicRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';

// Admin/Staff pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientForm from './pages/PatientForm';
import PatientDetail from './pages/PatientDetail';
import Consultations from './pages/Consultations';
import ConsultationForm from './pages/ConsultationForm';
import ConsultationView from './pages/ConsultationView';
import Appointments from './pages/Appointments';
import AppointmentForm from './pages/AppointmentForm';

// Patient pages
import PatientAuth from './pages/patient/PatientAuth';
import PatientPortal from './pages/patient/PatientPortal';
import BookAppointment from './pages/patient/BookAppointment';

export default function App() {
  return (
    <Routes>
      {/* ========== RUTAS ADMIN/STAFF ========== */}
      <Route path="/admin/login" element={<PublicRoute><Login /></PublicRoute>} />
      
      <Route path="/admin" element={<StaffRoute><Layout><Dashboard /></Layout></StaffRoute>} />
      <Route path="/admin/dashboard" element={<StaffRoute><Layout><Dashboard /></Layout></StaffRoute>} />
      
      <Route path="/admin/patients" element={<StaffRoute><Layout><Patients /></Layout></StaffRoute>} />
      <Route path="/admin/patients/new" element={<StaffRoute><Layout><PatientForm /></Layout></StaffRoute>} />
      <Route path="/admin/patients/:id" element={<StaffRoute><Layout><PatientDetail /></Layout></StaffRoute>} />
      <Route path="/admin/patients/:id/edit" element={<StaffRoute><Layout><PatientForm /></Layout></StaffRoute>} />

      <Route path="/admin/consultations" element={<StaffRoute><Layout><Consultations /></Layout></StaffRoute>} />
      <Route path="/admin/consultations/new" element={<StaffRoute><Layout><ConsultationForm /></Layout></StaffRoute>} />
      <Route path="/admin/consultations/:id" element={<StaffRoute><Layout><ConsultationView /></Layout></StaffRoute>} />
      <Route path="/admin/consultations/:id/edit" element={<StaffRoute><Layout><ConsultationForm /></Layout></StaffRoute>} />

      <Route path="/admin/appointments" element={<StaffRoute><Layout><Appointments /></Layout></StaffRoute>} />
      <Route path="/admin/appointments/new" element={<StaffRoute><Layout><AppointmentForm /></Layout></StaffRoute>} />
      <Route path="/admin/appointments/:id/edit" element={<StaffRoute><Layout><AppointmentForm /></Layout></StaffRoute>} />

      {/* ========== RUTAS PACIENTES ========== */}
      <Route path="/portal/login" element={<PatientAuth />} />
      <Route path="/portal/register" element={<PatientAuth />} />
      
      <Route path="/portal" element={<PatientRoute><PatientPortal /></PatientRoute>} />
      <Route path="/portal/book" element={<PatientRoute><BookAppointment /></PatientRoute>} />

      {/* ========== RUTAS LEGACY (redirect) ========== */}
      <Route path="/login" element={<Navigate to="/admin/login" replace />} />
      <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/patients" element={<Navigate to="/admin/patients" replace />} />
      <Route path="/patients/*" element={<Navigate to="/admin/patients" replace />} />
      <Route path="/consultations" element={<Navigate to="/admin/consultations" replace />} />
      <Route path="/consultations/*" element={<Navigate to="/admin/consultations" replace />} />
      <Route path="/appointments" element={<Navigate to="/admin/appointments" replace />} />
      <Route path="/patient-login" element={<Navigate to="/portal/login" replace />} />
      <Route path="/patient-portal" element={<Navigate to="/portal" replace />} />

      {/* ========== RUTA DEFAULT ========== */}
      <Route path="/" element={<Navigate to="/portal/login" replace />} />
      <Route path="*" element={<Navigate to="/portal/login" replace />} />
    </Routes>
  );
}

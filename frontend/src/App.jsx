// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { StaffRoute, PatientRoute, PublicRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';

import Login from './pages/Login';
import PatientLogin from './pages/PatientLogin';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientForm from './pages/PatientForm';
import PatientDetail from './pages/PatientDetail';
import Consultations from './pages/Consultations';
import ConsultationForm from './pages/ConsultationForm';
import ConsultationView from './pages/ConsultationView';
import Appointments from './pages/Appointments';
import AppointmentForm from './pages/AppointmentForm';
import PatientPortal from './pages/PatientPortal';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/patient-login" element={<PublicRoute><PatientLogin /></PublicRoute>} />
      <Route path="/patient-access/:token" element={<PatientLogin />} />

      <Route path="/dashboard" element={<StaffRoute><Layout><Dashboard /></Layout></StaffRoute>} />
      
      <Route path="/patients" element={<StaffRoute><Layout><Patients /></Layout></StaffRoute>} />
      <Route path="/patients/new" element={<StaffRoute><Layout><PatientForm /></Layout></StaffRoute>} />
      <Route path="/patients/:id" element={<StaffRoute><Layout><PatientDetail /></Layout></StaffRoute>} />
      <Route path="/patients/:id/edit" element={<StaffRoute><Layout><PatientForm /></Layout></StaffRoute>} />

      <Route path="/consultations" element={<StaffRoute><Layout><Consultations /></Layout></StaffRoute>} />
      <Route path="/consultations/new" element={<StaffRoute><Layout><ConsultationForm /></Layout></StaffRoute>} />

      <Route path="/appointments" element={<StaffRoute><Layout><Appointments /></Layout></StaffRoute>} />
      <Route path="/appointments/new" element={<StaffRoute><Layout><AppointmentForm /></Layout></StaffRoute>} />

      <Route path="/patient-portal" element={<PatientRoute><PatientPortal /></PatientRoute>} />

      <Route path="/consultations/:id" element={<StaffRoute><Layout><ConsultationView /></Layout></StaffRoute>}/>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

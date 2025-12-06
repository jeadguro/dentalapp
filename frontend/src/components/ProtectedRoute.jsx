// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full gradient-dental animate-pulse flex items-center justify-center">
          <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2c-3 0-5 1.6-6 4-.6 1.6-.4 3.6.4 5.6.6 1.6 1 3.6 1.6 6.4.2.8 1 1.2 1.6.8.4-.2.6-.6.8-1.2l1.2-5c.2-.6.6-1 1.2-1s1 .4 1.2 1l1.2 5c.2.6.4 1 .8 1.2.6.4 1.4 0 1.6-.8.6-2.8 1-4.8 1.6-6.4.8-2 1-4 .4-5.6-1-2.4-3-4-6-4h-1.6z"/>
          </svg>
        </div>
        <p className="text-gray-500">Cargando...</p>
      </div>
    </div>
  );
}

/* ----------------------------- STAFF ROUTE ----------------------------- */
export function StaffRoute({ children }) {
  const { user, loading, isStaff } = useAuth();
  const location = useLocation();

  if (loading) return <Loading />;

  // Si no está logueado → login staff
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  // Si está logueado pero NO es staff → portal del paciente
  if (!isStaff) return <Navigate to="/patient-portal" replace />;

  return children;
}

/* ---------------------------- PATIENT ROUTE ---------------------------- */
export function PatientRoute({ children }) {
  const { user, loading, isPatient } = useAuth();
  const location = useLocation();

  if (loading) return <Loading />;

  // Si no está logueado → login paciente
  if (!user) return <Navigate to="/patient-login" state={{ from: location }} replace />;

  // Si está logueado pero NO es paciente → dashboard del staff
  if (!isPatient) return <Navigate to="/dashboard" replace />;

  return children;
}

/* ----------------------------- PUBLIC ROUTE ---------------------------- */
export function PublicRoute({ children }) {
  const { user, loading, isStaff, isPatient } = useAuth();

  if (loading) return <Loading />;

  if (user && isStaff) return <Navigate to="/dashboard" replace />;
  if (user && isPatient) return <Navigate to="/patient-portal" replace />;

  return children;
}

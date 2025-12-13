// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, patientAuthAPI } from '../services/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await authAPI.getMe();
      const userType = data.data.type;
      localStorage.setItem('userType', userType);
      setUser({ ...data.data.profile, type: userType });
    } catch (err) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userType');
    } finally {
      setLoading(false);
    }
  };

  // Login para staff (admin/doctor)
  const login = async (email, password) => {
    setError(null);
    try {
      const { data } = await authAPI.login({ email, password });
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('userType', 'staff');
      setUser({ ...data.data.user, type: 'staff' });
      return data.data.user;
    } catch (err) {
      const message = err.response?.data?.message || 'Error al iniciar sesión';
      setError(message);
      throw new Error(message);
    }
  };

  // Login para paciente con email y password
  const patientLogin = async (email, password) => {
    setError(null);
    try {
      const { data } = await patientAuthAPI.login({ email, password });
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('userType', 'patient');
      setUser({ ...data.data.patient, type: 'patient' });
      return data.data.patient;
    } catch (err) {
      const message = err.response?.data?.message || 'Error al iniciar sesión';
      setError(message);
      throw new Error(message);
    }
  };

  // Login legacy para paciente (sin password)
  const patientLoginLegacy = async (method, value) => {
    setError(null);
    try {
      let response;
      if (method === 'email') {
        response = await patientAuthAPI.loginByEmail(value);
      } else if (method === 'code') {
        response = await patientAuthAPI.loginByCode(value);
      } else if (method === 'token') {
        response = await patientAuthAPI.loginByToken(value);
      }
      
      const { data } = response;
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('userType', 'patient');
      setUser({ ...data.data.patient, type: 'patient' });
      return data.data.patient;
    } catch (err) {
      const message = err.response?.data?.message || 'Error al acceder';
      setError(message);
      throw new Error(message);
    }
  };

  // Registro de paciente
  const patientRegister = async (userData) => {
    setError(null);
    try {
      const { data } = await patientAuthAPI.register(userData);
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('userType', 'patient');
      setUser({ ...data.data.patient, type: 'patient' });
      return data.data.patient;
    } catch (err) {
      const message = err.response?.data?.message || 'Error al registrarse';
      setError(message);
      throw new Error(message);
    }
  };

  const logout = () => {
    const wasPatient = localStorage.getItem('userType') === 'patient';
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    setUser(null);
    return wasPatient;
  };

  const isStaff = user?.type === 'staff';
  const isPatient = user?.type === 'patient';
  const isAdmin = isStaff && user?.role === 'admin';
  const isDoctor = isStaff && (user?.role === 'doctor' || user?.role === 'admin');

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      setError,
      login,
      patientLogin,
      patientLoginLegacy,
      patientRegister,
      logout,
      isStaff,
      isPatient,
      isAdmin,
      isDoctor
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

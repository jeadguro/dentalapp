// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

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
      setUser({ ...data.data.profile, type: data.data.type });
    } catch (err) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setError(null);
    try {
      const { data } = await authAPI.login({ email, password });
      localStorage.setItem('token', data.data.token);
      setUser({ ...data.data.user, type: 'staff' });
      return data.data.user;
    } catch (err) {
      const message = err.response?.data?.message || 'Error al iniciar sesión';
      setError(message);
      throw new Error(message);
    }
  };

  const patientLogin = async (method, value) => {
    setError(null);
    try {
      let response;
      if (method === 'email') {
        response = await authAPI.patientLoginEmail(value);
      } else if (method === 'code') {
        response = await authAPI.patientLoginCode(value);
      } else if (method === 'token') {
        response = await authAPI.patientLoginToken(value);
      }
      
      const { data } = response;
      localStorage.setItem('token', data.data.token);
      setUser({ ...data.data.patient, type: 'patient' });
      return data.data.patient;
    } catch (err) {
      const message = err.response?.data?.message || 'Error al acceder';
      setError(message);
      throw new Error(message);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const isStaff = user?.type === 'staff';
  const isPatient = user?.type === 'patient';
  const isAdmin = isStaff && user?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user, loading, error, login, patientLogin, logout, isStaff, isPatient, isAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

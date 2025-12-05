// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl gradient-dental flex items-center justify-center">
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2c-3 0-5 1.6-6 4-.6 1.6-.4 3.6.4 5.6.6 1.6 1 3.6 1.6 6.4.2.8 1 1.2 1.6.8.4-.2.6-.6.8-1.2l1.2-5c.2-.6.6-1 1.2-1s1 .4 1.2 1l1.2 5c.2.6.4 1 .8 1.2.6.4 1.4 0 1.6-.8.6-2.8 1-4.8 1.6-6.4.8-2 1-4 .4-5.6-1-2.4-3-4-6-4h-1.6z"/>
              </svg>
            </div>
            <span className="font-display font-bold text-2xl text-charcoal-900">DentalCare<span className="text-dental-600 ml-1">Pro</span></span>
          </div>

          <h1 className="text-3xl font-display font-bold text-charcoal-900 mb-2">Bienvenido</h1>
          <p className="text-gray-500 mb-8">Ingresa tus credenciales para acceder</p>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="input-label">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="tu@email.com" required />
            </div>
            <div>
              <label className="input-label">Contraseña</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="input-field pr-12" placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Iniciando...' : <><LogIn className="w-5 h-5" /> Iniciar sesión</>}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">¿Eres paciente? <Link to="/patient-login" className="text-dental-600 hover:text-dental-700 font-medium">Accede aquí</Link></p>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex lg:flex-1 gradient-dental items-center justify-center p-12 relative">
        <div className="text-center text-white max-w-lg">
          <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-white/10 backdrop-blur flex items-center justify-center">
            <svg className="w-14 h-14 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2c-3 0-5 1.6-6 4-.6 1.6-.4 3.6.4 5.6.6 1.6 1 3.6 1.6 6.4.2.8 1 1.2 1.6.8.4-.2.6-.6.8-1.2l1.2-5c.2-.6.6-1 1.2-1s1 .4 1.2 1l1.2 5c.2.6.4 1 .8 1.2.6.4 1.4 0 1.6-.8.6-2.8 1-4.8 1.6-6.4.8-2 1-4 .4-5.6-1-2.4-3-4-6-4h-1.6z"/>
            </svg>
          </div>
          <h2 className="text-3xl font-display font-bold mb-4">Sistema de Gestión Dental</h2>
          <p className="text-white/80">Administra pacientes, consultas y citas de manera eficiente</p>
        </div>
      </div>
    </div>
  );
}

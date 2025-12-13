// src/pages/PatientLogin.jsx
import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Key, QrCode, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';

export default function PatientLogin() {
  const { token: urlToken } = useParams();
  const [method, setMethod] = useState(urlToken ? 'token' : 'email');
  const [value, setValue] = useState(urlToken || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { patientLogin } = useAuth();
  const navigate = useNavigate();

  // Si hay token en la URL, intentar login automático
  useState(() => {
    if (urlToken) {
      handleSubmit({ preventDefault: () => {} });
    }
  }, [urlToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await patientLogin(method, value);
      navigate('/patient-portal');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const methods = [
    { id: 'email', label: 'Email', icon: Mail, placeholder: 'tu@email.com' },
    { id: 'code', label: 'Código', icon: Key, placeholder: 'ABC123' },
    { id: 'token', label: 'QR/Link', icon: QrCode, placeholder: 'Token de acceso' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50 p-8">
      <div className="w-full max-w-md">
        <Link to="/login" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-8">
          <ArrowLeft className="w-4 h-4" /><span className="text-sm">Acceso para personal</span>
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl gradient-dental flex items-center justify-center">
            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2c-3 0-5 1.6-6 4-.6 1.6-.4 3.6.4 5.6.6 1.6 1 3.6 1.6 6.4.2.8 1 1.2 1.6.8.4-.2.6-.6.8-1.2l1.2-5c.2-.6.6-1 1.2-1s1 .4 1.2 1l1.2 5c.2.6.4 1 .8 1.2.6.4 1.4 0 1.6-.8.6-2.8 1-4.8 1.6-6.4.8-2 1-4 .4-5.6-1-2.4-3-4-6-4h-1.6z"/>
            </svg>
          </div>
          <span className="font-display font-bold text-2xl text-charcoal-900">Portal del <span className="text-dental-600">Paciente</span></span>
        </div>

        <div className="card p-8">
          <h1 className="text-2xl font-display font-bold text-charcoal-900 text-center mb-2">Accede a tu historial</h1>
          <p className="text-gray-500 text-center mb-6">Elige tu método de acceso</p>

          {/* Method tabs */}
          <div className="flex gap-2 mb-6">
            {methods.map((m) => {
              const Icon = m.icon;
              return (
                <button key={m.id} onClick={() => { setMethod(m.id); setValue(''); }} 
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${method === m.id ? 'bg-dental-100 text-dental-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  <Icon className="w-4 h-4" />{m.label}
                </button>
              );
            })}
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="input-label">
                {methods.find(m => m.id === method)?.label}
              </label>
              <input type={method === 'email' ? 'email' : 'text'} value={value} onChange={(e) => setValue(e.target.value)}
                className="input-field" placeholder={methods.find(m => m.id === method)?.placeholder} required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Accediendo...' : 'Acceder'}
            </button>
          </form>

          <p className="mt-6 text-xs text-gray-400 text-center">
            Solo pacientes registrados. Contacta a tu dentista si no tienes acceso.
          </p>
        </div>
      </div>
    </div>
  );
}

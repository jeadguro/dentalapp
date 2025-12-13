// src/pages/AppointmentForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { appointmentsAPI, patientsAPI, authAPI } from '../services/api';
import { formatForInput } from '../utils/dateUtils';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';

const TYPES = [
  { id: 'checkup', label: 'Revisión general', duration: 30 },
  { id: 'cleaning', label: 'Limpieza dental', duration: 45 },
  { id: 'filling', label: 'Empaste', duration: 60 },
  { id: 'extraction', label: 'Extracción', duration: 45 },
  { id: 'rootcanal', label: 'Endodoncia', duration: 90 },
  { id: 'crown', label: 'Corona', duration: 60 },
  { id: 'whitening', label: 'Blanqueamiento', duration: 60 },
  { id: 'orthodontics', label: 'Ortodoncia', duration: 45 },
  { id: 'implant', label: 'Implante', duration: 120 },
  { id: 'emergency', label: 'Urgencia', duration: 30 },
  { id: 'other', label: 'Otro', duration: 30 },
];

export default function AppointmentForm() {
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patient');
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({ 
    patient: patientId || '', 
    doctor: '', 
    date: formatForInput(new Date()), 
    type: 'checkup', 
    notes: '' 
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      patientsAPI.getAll(),
      authAPI.getDoctors()
    ]).then(([patientsRes, doctorsRes]) => {
      setPatients(patientsRes.data.data.patients);
      setDoctors(doctorsRes.data.data);
      // Si solo hay un doctor, seleccionarlo automáticamente
      if (doctorsRes.data.data.length === 1) {
        setForm(f => ({ ...f, doctor: doctorsRes.data.data[0]._id }));
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patient) { setError('Selecciona un paciente'); return; }
    if (!form.doctor) { setError('Selecciona un doctor'); return; }
    setError('');
    setSaving(true);
    try {
      await appointmentsAPI.create(form);
      navigate('/admin/appointments');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="page-container max-w-2xl">
      <div className="animate-pulse space-y-4">
        {[1,2,3,4].map(i => <div key={i} className="h-12 bg-gray-200 rounded"></div>)}
      </div>
    </div>
  );

  return (
    <div className="page-container max-w-2xl">
      <Link to="/admin/appointments" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" />Volver
      </Link>
      <h1 className="page-title mb-8">Nueva Cita</h1>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div>
          <label className="input-label">Paciente *</label>
          <select 
            value={form.patient} 
            onChange={(e) => setForm({...form, patient: e.target.value})} 
            className="input-field" 
            required
          >
            <option value="">-- Seleccionar paciente --</option>
            {patients.map(p => (
              <option key={p._id} value={p._id}>{p.name} ({p.email})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="input-label">Doctor *</label>
          <select 
            value={form.doctor} 
            onChange={(e) => setForm({...form, doctor: e.target.value})} 
            className="input-field" 
            required
          >
            <option value="">-- Seleccionar doctor --</option>
            {doctors.map(d => (
              <option key={d._id} value={d._id}>
                Dr. {d.name} {d.specialty ? `(${d.specialty})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="input-label">Fecha y hora *</label>
          <input 
            type="datetime-local" 
            value={form.date} 
            onChange={(e) => setForm({...form, date: e.target.value})} 
            className="input-field" 
            required 
          />
        </div>

        <div>
          <label className="input-label">Tipo de cita *</label>
          <select 
            value={form.type} 
            onChange={(e) => setForm({...form, type: e.target.value})} 
            className="input-field" 
            required
          >
            {TYPES.map(t => (
              <option key={t.id} value={t.id}>{t.label} ({t.duration} min)</option>
            ))}
          </select>
        </div>

        <div>
          <label className="input-label">Notas</label>
          <textarea 
            value={form.notes} 
            onChange={(e) => setForm({...form, notes: e.target.value})} 
            className="input-field min-h-[80px]" 
            placeholder="Indicaciones especiales..." 
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Link to="/admin/appointments" className="btn-secondary">Cancelar</Link>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Guardando...' : <><Save className="w-5 h-5" />Crear Cita</>}
          </button>
        </div>
      </form>
    </div>
  );
}

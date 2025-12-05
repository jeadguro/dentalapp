// src/pages/PatientForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { patientsAPI } from '../services/api';
import { formatForDateInput } from '../utils/dateUtils';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';

export default function PatientForm() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', birthdate: '', address: '', notes: '' });
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditing) {
      patientsAPI.getOne(id).then(({ data }) => {
        const p = data.data.patient;
        setForm({ name: p.name || '', email: p.email || '', phone: p.phone || '', birthdate: p.birthdate ? formatForDateInput(p.birthdate) : '', address: p.address || '', notes: p.notes || '' });
      }).catch(() => setError('Paciente no encontrado')).finally(() => setLoading(false));
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isEditing) await patientsAPI.update(id, form);
      else await patientsAPI.create(form);
      navigate('/patients');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-container max-w-2xl"><div className="animate-pulse space-y-4">{[1,2,3,4].map(i => <div key={i} className="h-12 bg-gray-200 rounded"></div>)}</div></div>;

  return (
    <div className="page-container max-w-2xl">
      <Link to="/patients" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"><ArrowLeft className="w-4 h-4" />Volver</Link>
      <h1 className="page-title mb-8">{isEditing ? 'Editar' : 'Nuevo'} Paciente</h1>

      {error && <div className="mb-6 p-4 rounded-xl bg-red-50 flex items-center gap-3"><AlertCircle className="w-5 h-5 text-red-500" /><p className="text-sm text-red-600">{error}</p></div>}

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div><label className="input-label">Nombre *</label><input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="input-field" required /></div>
        <div><label className="input-label">Email *</label><input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="input-field" required /></div>
        <div><label className="input-label">Teléfono</label><input type="tel" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="input-field" /></div>
        <div><label className="input-label">Fecha de nacimiento</label><input type="date" value={form.birthdate} onChange={(e) => setForm({...form, birthdate: e.target.value})} className="input-field" /></div>
        <div><label className="input-label">Dirección</label><input type="text" value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} className="input-field" /></div>
        <div><label className="input-label">Notas</label><textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} className="input-field min-h-[100px]" /></div>
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Link to="/patients" className="btn-secondary">Cancelar</Link>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Guardando...' : <><Save className="w-5 h-5" />{isEditing ? 'Guardar' : 'Crear'}</>}</button>
        </div>
      </form>
    </div>
  );
}

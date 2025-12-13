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
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    birthdate: '', 
    address: '', 
    notes: '',
    gender: '',
    allergies: '',
    medicalConditions: ''
  });
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditing) {
      patientsAPI.getOne(id)
        .then(({ data }) => {
          const p = data.data.patient;
          setForm({ 
            name: p.name || '', 
            email: p.email || '', 
            phone: p.phone || '', 
            birthdate: p.birthdate ? formatForDateInput(p.birthdate) : '', 
            address: p.address || '', 
            notes: p.notes || '',
            gender: p.gender || '',
            allergies: p.allergies || '',
            medicalConditions: p.medicalConditions || ''
          });
        })
        .catch(() => setError('Paciente no encontrado'))
        .finally(() => setLoading(false));
    }
  }, [id, isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isEditing) {
        await patientsAPI.update(id, form);
      } else {
        await patientsAPI.create(form);
      }
      navigate('/admin/patients');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container max-w-2xl">
        <div className="animate-pulse space-y-4">
          {[1,2,3,4].map(i => <div key={i} className="h-12 bg-gray-200 rounded"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container max-w-2xl">
      <Link to="/admin/patients" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" />Volver
      </Link>
      
      <h1 className="page-title mb-8">{isEditing ? 'Editar' : 'Nuevo'} Paciente</h1>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información básica */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Información básica</h2>
          
          <div>
            <label className="input-label">Nombre completo *</label>
            <input 
              type="text" 
              value={form.name} 
              onChange={(e) => setForm({...form, name: e.target.value})} 
              className="input-field" 
              placeholder="Nombre del paciente"
              required 
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Email *</label>
              <input 
                type="email" 
                value={form.email} 
                onChange={(e) => setForm({...form, email: e.target.value})} 
                className="input-field" 
                placeholder="correo@ejemplo.com"
                required 
              />
            </div>
            
            <div>
              <label className="input-label">Teléfono</label>
              <input 
                type="tel" 
                value={form.phone} 
                onChange={(e) => setForm({...form, phone: e.target.value})} 
                className="input-field" 
                placeholder="+52 123 456 7890"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Fecha de nacimiento</label>
              <input 
                type="date" 
                value={form.birthdate} 
                onChange={(e) => setForm({...form, birthdate: e.target.value})} 
                className="input-field" 
              />
            </div>
            
            <div>
              <label className="input-label">Género</label>
              <select 
                value={form.gender} 
                onChange={(e) => setForm({...form, gender: e.target.value})} 
                className="input-field"
              >
                <option value="">-- Seleccionar --</option>
                <option value="male">Masculino</option>
                <option value="female">Femenino</option>
                <option value="other">Otro</option>
              </select>
            </div>
          </div>

          <div>
            <label className="input-label">Dirección</label>
            <input 
              type="text" 
              value={form.address} 
              onChange={(e) => setForm({...form, address: e.target.value})} 
              className="input-field" 
              placeholder="Calle, número, colonia, ciudad"
            />
          </div>
        </div>

        {/* Información médica */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Información médica</h2>
          
          <div>
            <label className="input-label">Alergias</label>
            <textarea 
              value={form.allergies} 
              onChange={(e) => setForm({...form, allergies: e.target.value})} 
              className="input-field min-h-[80px]" 
              placeholder="Alergias a medicamentos, materiales, etc."
            />
          </div>

          <div>
            <label className="input-label">Condiciones médicas</label>
            <textarea 
              value={form.medicalConditions} 
              onChange={(e) => setForm({...form, medicalConditions: e.target.value})} 
              className="input-field min-h-[80px]" 
              placeholder="Diabetes, hipertensión, enfermedades cardíacas, etc."
            />
          </div>

          <div>
            <label className="input-label">Notas adicionales</label>
            <textarea 
              value={form.notes} 
              onChange={(e) => setForm({...form, notes: e.target.value})} 
              className="input-field min-h-[80px]" 
              placeholder="Observaciones generales sobre el paciente"
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3">
          <Link to="/admin/patients" className="btn-secondary">Cancelar</Link>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Guardando...' : <><Save className="w-5 h-5" />{isEditing ? 'Guardar cambios' : 'Crear paciente'}</>}
          </button>
        </div>
      </form>
    </div>
  );
}

// src/pages/ConsultationForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { consultationsAPI, patientsAPI } from '../services/api';
import { formatForInput } from '../utils/dateUtils';
import { ArrowLeft, Save, Upload, X, AlertCircle } from 'lucide-react';

export default function ConsultationForm() {
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patient');
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({ patient: patientId || '', date: formatForInput(new Date()), diagnosis: '', treatment: '', notes: '' });
  const [photos, setPhotos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    patientsAPI.getAll().then(({ data }) => setPatients(data.data.patients)).finally(() => setLoading(false));
  }, []);

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    setPhotos(prev => [...prev, ...files]);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviews(prev => [...prev, ev.target.result]);
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patient) { setError('Selecciona un paciente'); return; }
    if (!form.diagnosis) { setError('El diagnóstico es requerido'); return; }
    setError('');
    setSaving(true);
    try {
      const { data } = await consultationsAPI.create(form);
      if (photos.length > 0) {
        const formData = new FormData();
        photos.forEach(p => formData.append('photos', p));
        await consultationsAPI.uploadPhotos(data.data.consultation._id, formData);
      }
      navigate('/consultations');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-container max-w-3xl"><div className="animate-pulse space-y-4">{[1,2,3,4].map(i => <div key={i} className="h-12 bg-gray-200 rounded"></div>)}</div></div>;

  return (
    <div className="page-container max-w-3xl">
      <Link to="/consultations" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"><ArrowLeft className="w-4 h-4" />Volver</Link>
      <h1 className="page-title mb-8">Nueva Consulta</h1>

      {error && <div className="mb-6 p-4 rounded-xl bg-red-50 flex items-center gap-3"><AlertCircle className="w-5 h-5 text-red-500" /><p className="text-sm text-red-600">{error}</p></div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Paciente</h2>
          <select value={form.patient} onChange={(e) => setForm({...form, patient: e.target.value})} className="input-field" required>
            <option value="">-- Seleccionar --</option>
            {patients.map(p => <option key={p._id} value={p._id}>{p.name} ({p.email})</option>)}
          </select>
        </div>

        <div className="card p-6 space-y-5">
          <h2 className="text-lg font-semibold">Detalles</h2>
          <div><label className="input-label">Fecha y hora</label><input type="datetime-local" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} className="input-field" required /></div>
          <div><label className="input-label">Diagnóstico *</label><input type="text" value={form.diagnosis} onChange={(e) => setForm({...form, diagnosis: e.target.value})} className="input-field" placeholder="Ej: Caries en molar" required /></div>
          <div><label className="input-label">Tratamiento</label><input type="text" value={form.treatment} onChange={(e) => setForm({...form, treatment: e.target.value})} className="input-field" placeholder="Ej: Empaste con resina" /></div>
          <div><label className="input-label">Notas</label><textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} className="input-field min-h-[100px]" /></div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Fotografías</h2>
          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              {previews.map((p, i) => (
                <div key={i} className="relative group">
                  <img src={p} alt="" className="w-full aspect-square object-cover rounded-lg" />
                  <button type="button" onClick={() => removePhoto(i)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100"><X className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-dental-500 hover:bg-dental-50">
            <Upload className="w-8 h-8 text-gray-400 mb-2" /><span className="text-sm text-gray-500">Subir fotos</span>
            <input type="file" accept="image/*" multiple onChange={handlePhotoChange} className="hidden" />
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <Link to="/consultations" className="btn-secondary">Cancelar</Link>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Guardando...' : <><Save className="w-5 h-5" />Guardar</>}</button>
        </div>
      </form>
    </div>
  );
}

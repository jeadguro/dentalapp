// src/pages/ConsultationForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { consultationsAPI, patientsAPI } from '../services/api';
import { formatForInput } from '../utils/dateUtils';
import Odontogram from "../components/Odontogram"; // <-- IMPORTANTE
import { ArrowLeft, Save, Upload, X, Plus, Trash2, AlertCircle } from 'lucide-react';

export default function ConsultationForm() {
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patient');
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    patient: patientId || '',
    date: formatForInput(new Date()),
    diagnosis: '',
    treatment: '',
    notes: '',
    procedures: [],
    cost: '',
    paymentStatus: 'pending',
    nextAppointmentRecommended: '',
    odontogram: {}          // <-- Array de dientes seleccionados
  });

  const [photos, setPhotos] = useState([]);
  const [previews, setPreviews] = useState([]);

  // Cargar pacientes
  useEffect(() => {
    patientsAPI
      .getAll()
      .then(({ data }) => setPatients(data.data.patients))
      .finally(() => setLoading(false));
  }, []);

  // PROCEDIMIENTOS
  const addProcedure = () => {
    setForm(prev => ({
      ...prev,
      procedures: [...prev.procedures, { name: '', tooth: '', notes: '' }]
    }));
  };

  const updateProcedure = (index, field, value) => {
    const updated = [...form.procedures];
    updated[index][field] = value;
    setForm({ ...form, procedures: updated });
  };

  const removeProcedure = (index) => {
    setForm(prev => ({
      ...prev,
      procedures: prev.procedures.filter((_, i) => i !== index)
    }));
  };

  // FOTOS
  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    setPhotos(prev => [...prev, ...files]);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => setPreviews(prev => [...prev, ev.target.result]);
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // ENVIAR FORMULARIO
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.patient) return setError("Selecciona un paciente");
    if (!form.diagnosis) return setError("El diagnóstico es requerido");

    setError('');
    setSaving(true);

    try {
      // Enviar consulta + odontograma
      const { data } = await consultationsAPI.create(form);
      const consultationId = data.data.consultation._id;

      // Subir fotos si hay
      if (photos.length > 0) {
        const formData = new FormData();
        photos.forEach(photo => formData.append('photos', photo));
        await consultationsAPI.uploadPhotos(consultationId, formData);
      }

      navigate('/consultations');
    } catch (err) {
      setError(err.response?.data?.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="page-container max-w-3xl">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );

  return (
    <div className="page-container max-w-3xl">
      <Link to="/consultations" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Volver
      </Link>

      <h1 className="page-title mb-6">Nueva Consulta</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* PACIENTE */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Paciente</h2>
          <select
            value={form.patient}
            onChange={e => setForm({ ...form, patient: e.target.value })}
            className="input-field"
            required
          >
            <option value="">-- Seleccionar --</option>
            {patients.map(p => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.email})
              </option>
            ))}
          </select>
        </div>

        {/* DETALLES */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Detalles de consulta</h2>

          <input
            type="datetime-local"
            value={form.date}
            onChange={e => setForm({ ...form, date: e.target.value })}
            className="input-field"
          />

          <input
            type="text"
            className="input-field"
            placeholder="Diagnóstico"
            value={form.diagnosis}
            onChange={e => setForm({ ...form, diagnosis: e.target.value })}
            required
          />

          <input
            type="text"
            className="input-field"
            placeholder="Tratamiento"
            value={form.treatment}
            onChange={e => setForm({ ...form, treatment: e.target.value })}
          />

          <textarea
            className="input-field min-h-[100px]"
            placeholder="Notas"
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
          ></textarea>
        </div>

        {/* ODONTOGRAMA */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Odontograma</h2>

          <Odontogram
            value={form.odontogram}
            onChange={(o) => setForm({ ...form, odontogram: o })}
          />
        </div>

        {/* PROCEDIMIENTOS */}
        <div className="card p-6 space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Procedimientos</h2>
            <button
              type="button"
              className="btn-primary !px-3 !py-1"
              onClick={addProcedure}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {form.procedures.map((proc, i) => (
            <div key={i} className="border p-4 rounded-lg bg-gray-50 space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nombre del procedimiento"
                  className="input-field flex-1"
                  value={proc.name}
                  onChange={e => updateProcedure(i, 'name', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Diente"
                  className="input-field w-32"
                  value={proc.tooth}
                  onChange={e => updateProcedure(i, 'tooth', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeProcedure(i)}
                  className="text-red-500"
                >
                  <Trash2 />
                </button>
              </div>
              <textarea
                placeholder="Notas"
                className="input-field"
                value={proc.notes}
                onChange={e => updateProcedure(i, 'notes', e.target.value)}
              ></textarea>
            </div>
          ))}
        </div>

        {/* PAGO */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Pago</h2>

          <input
            type="number"
            className="input-field"
            placeholder="Costo"
            value={form.cost}
            onChange={e => setForm({ ...form, cost: e.target.value })}
          />

          <select
            value={form.paymentStatus}
            onChange={e => setForm({ ...form, paymentStatus: e.target.value })}
            className="input-field"
          >
            <option value="pending">Pendiente</option>
            <option value="partial">Parcial</option>
            <option value="paid">Pagado</option>
          </select>
        </div>

        {/* FOTOS */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Fotografías</h2>

          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              {previews.map((p, i) => (
                <div key={i} className="relative group">
                  <img src={p} alt="" className="w-full aspect-square object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50">
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-500">Subir fotos</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoChange} />
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <Link className="btn-secondary" to="/consultations">Cancelar</Link>
          <button className="btn-primary" disabled={saving}>
            {saving ? "Guardando..." : <><Save className="w-5 h-5" /> Guardar</>}
          </button>
        </div>
      </form>
    </div>
  );
}

// src/pages/ConsultationForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams, Link } from 'react-router-dom';
import { consultationsAPI, patientsAPI, authAPI } from '../services/api';
import { formatForInput } from '../utils/dateUtils';
import { useAuth } from '../contexts/AuthContext';
import Odontogram from "../components/Odontogram";
import { ArrowLeft, Save, Upload, X, Plus, Trash2, AlertCircle } from 'lucide-react';

export default function ConsultationForm() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patient');
  const appointmentId = searchParams.get('appointment');
  const navigate = useNavigate();
  const { user } = useAuth();

  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    patient: patientId || '',
    doctor: '',
    date: formatForInput(new Date()),
    diagnosis: '',
    treatment: '',
    notes: '',
    procedures: [],
    cost: '',
    paymentStatus: 'pending',
    nextAppointmentRecommended: '',
    odontogram: {},
    appointment: appointmentId || ''
  });

  const [photos, setPhotos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [existingPhotos, setExistingPhotos] = useState([]);

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        const [patientsRes, doctorsRes] = await Promise.all([
          patientsAPI.getAll(),
          authAPI.getDoctors()
        ]);
        
        setPatients(patientsRes.data.data.patients);
        setDoctors(doctorsRes.data.data.doctors);

        // Si hay un solo doctor o el usuario actual es doctor, auto-seleccionar
        const doctorsList = doctorsRes.data.data.doctors;
        if (doctorsList.length === 1) {
          setForm(prev => ({ ...prev, doctor: doctorsList[0]._id }));
        } else if (user?._id) {
          const isUserDoctor = doctorsList.find(d => d._id === user._id);
          if (isUserDoctor) {
            setForm(prev => ({ ...prev, doctor: user._id }));
          }
        }

        // Si es edición, cargar la consulta
        if (isEditing) {
          const { data } = await consultationsAPI.getOne(id);
          const c = data.data?.consultation || data.consultation || data;
          setForm({
            patient: c.patient?._id || '',
            doctor: c.doctor?._id || '',
            date: formatForInput(c.date),
            diagnosis: c.diagnosis || '',
            treatment: c.treatment || '',
            notes: c.notes || '',
            procedures: c.procedures || [],
            cost: c.cost || '',
            paymentStatus: c.paymentStatus || 'pending',
            nextAppointmentRecommended: c.nextAppointmentRecommended ? formatForInput(c.nextAppointmentRecommended) : '',
            odontogram: c.odontogram || {},
            appointment: c.appointment || ''
          });
          setExistingPhotos(c.photos || []);
        }
      } catch (err) {
        console.error(err);
        setError('Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [id, isEditing, user]);

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

  const removeExistingPhoto = async (photoIndex) => {
    // Por ahora solo lo quitamos visualmente
    // TODO: Implementar eliminación en backend
    setExistingPhotos(prev => prev.filter((_, i) => i !== photoIndex));
  };

  // ENVIAR FORMULARIO
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.patient) return setError("Selecciona un paciente");
    if (!form.diagnosis) return setError("El diagnóstico es requerido");

    setError('');
    setSaving(true);

    try {
      let consultationId;

      // Preparar datos (omitir doctor si no está seleccionado para compatibilidad)
      const formData = { ...form };
      if (!formData.doctor) delete formData.doctor;
      if (!formData.appointment) delete formData.appointment;

      if (isEditing) {
        await consultationsAPI.update(id, formData);
        consultationId = id;
      } else {
        const { data } = await consultationsAPI.create(formData);
        consultationId = data.data.consultation._id;
      }

      // Subir fotos nuevas si hay
      if (photos.length > 0) {
        const photoFormData = new FormData();
        photos.forEach(photo => photoFormData.append('photos', photo));
        await consultationsAPI.uploadPhotos(consultationId, photoFormData);
      }

      navigate('/admin/consultations');
    } catch (err) {
      setError(err.response?.data?.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container max-w-3xl">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container max-w-3xl">
      <Link to="/admin/consultations" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Volver
      </Link>

      <h1 className="page-title mb-6">{isEditing ? 'Editar' : 'Nueva'} Consulta</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* PACIENTE Y DOCTOR */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Información General</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Paciente */}
            <div>
              <label className="input-label">Paciente *</label>
              <select
                value={form.patient}
                onChange={e => setForm({ ...form, patient: e.target.value })}
                className="input-field"
                required
              >
                <option value="">-- Seleccionar paciente --</option>
                {patients.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Doctor */}
            <div>
              <label className="input-label">Doctor</label>
              <select
                value={form.doctor}
                onChange={e => setForm({ ...form, doctor: e.target.value })}
                className="input-field"
              >
                <option value="">-- Seleccionar doctor --</option>
                {doctors.map(d => (
                  <option key={d._id} value={d._id}>
                    Dr. {d.name} {d.specialty ? `(${d.specialty})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fecha */}
          <div>
            <label className="input-label">Fecha y hora</label>
            <input
              type="datetime-local"
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
              className="input-field"
            />
          </div>
        </div>

        {/* DETALLES */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Detalles de la consulta</h2>

          <div>
            <label className="input-label">Diagnóstico *</label>
            <input
              type="text"
              className="input-field"
              placeholder="Diagnóstico principal"
              value={form.diagnosis}
              onChange={e => setForm({ ...form, diagnosis: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="input-label">Tratamiento</label>
            <input
              type="text"
              className="input-field"
              placeholder="Tratamiento aplicado o recomendado"
              value={form.treatment}
              onChange={e => setForm({ ...form, treatment: e.target.value })}
            />
          </div>

          <div>
            <label className="input-label">Notas adicionales</label>
            <textarea
              className="input-field min-h-[100px]"
              placeholder="Observaciones, recomendaciones, etc."
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>

        {/* ODONTOGRAMA */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">🦷 Odontograma</h2>
          <Odontogram
            value={form.odontogram}
            onChange={(o) => setForm({ ...form, odontogram: o })}
          />
        </div>

        {/* PROCEDIMIENTOS */}
        <div className="card p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Procedimientos</h2>
            <button
              type="button"
              className="btn-secondary !px-3 !py-1 text-sm"
              onClick={addProcedure}
            >
              <Plus className="w-4 h-4" /> Agregar
            </button>
          </div>

          {form.procedures.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay procedimientos registrados</p>
          ) : (
            form.procedures.map((proc, i) => (
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
                    className="input-field w-24"
                    value={proc.tooth}
                    onChange={e => updateProcedure(i, 'tooth', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeProcedure(i)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  placeholder="Notas del procedimiento"
                  className="input-field text-sm"
                  value={proc.notes}
                  onChange={e => updateProcedure(i, 'notes', e.target.value)}
                />
              </div>
            ))
          )}
        </div>

        {/* PAGO */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Pago</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Costo ($)</label>
              <input
                type="number"
                className="input-field"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={form.cost}
                onChange={e => setForm({ ...form, cost: e.target.value })}
              />
            </div>

            <div>
              <label className="input-label">Estado del pago</label>
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
          </div>
        </div>

        {/* FOTOS */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">📷 Fotografías</h2>

          {/* Fotos existentes */}
          {existingPhotos.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">Fotos existentes:</p>
              <div className="grid grid-cols-4 gap-3">
                {existingPhotos.map((photo, i) => (
                  <div key={i} className="relative group">
                    <img 
                      src={typeof photo === 'string' ? photo : photo.url} 
                      alt="" 
                      className="w-full aspect-square object-cover rounded-lg" 
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingPhoto(i)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Previews de nuevas fotos */}
          {previews.length > 0 && (
            <div className="grid grid-cols-4 gap-3 mb-4">
              {previews.map((p, i) => (
                <div key={i} className="relative group">
                  <img src={p} alt="" className="w-full aspect-square object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-teal-500 hover:bg-teal-50 transition-colors">
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-500">Subir fotos</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoChange} />
          </label>
        </div>

        {/* BOTONES */}
        <div className="flex justify-end gap-3">
          <Link className="btn-secondary" to="/admin/consultations">Cancelar</Link>
          <button className="btn-primary" disabled={saving}>
            {saving ? "Guardando..." : <><Save className="w-5 h-5" /> {isEditing ? 'Guardar cambios' : 'Crear consulta'}</>}
          </button>
        </div>
      </form>
    </div>
  );
}

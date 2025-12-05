// src/pages/PatientDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { patientsAPI } from '../services/api';
import { formatDate, formatDateTime, calculateAge } from '../utils/dateUtils';
import { ArrowLeft, Edit, Mail, Phone, Calendar, MapPin, FileText, Clock, Plus } from 'lucide-react';

export default function PatientDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('consultations');

  useEffect(() => {
    patientsAPI.getHistory(id).then(({ data: res }) => setData(res.data)).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page-container"><div className="animate-pulse space-y-4"><div className="h-32 bg-gray-200 rounded-2xl"></div><div className="h-64 bg-gray-200 rounded-2xl"></div></div></div>;
  if (!data) return <div className="page-container text-center py-12"><p className="text-gray-500">Paciente no encontrado</p></div>;

  const { patient, consultations, appointments, stats } = data;

  return (
    <div className="page-container">
      <Link to="/patients" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"><ArrowLeft className="w-4 h-4" />Volver</Link>

      <div className="card p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-dental-100 flex items-center justify-center">
            <span className="text-3xl font-bold text-dental-600">{patient.name?.charAt(0)?.toUpperCase()}</span>
          </div>
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-display font-bold text-charcoal-900">{patient.name}</h1>
                <p className="text-gray-500">Paciente desde {formatDate(patient.createdAt, "MMMM yyyy")}</p>
              </div>
              <Link to={`/patients/${id}/edit`} className="btn-secondary"><Edit className="w-4 h-4" />Editar</Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              {patient.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" /><span className="text-sm">{patient.email}</span></div>}
              {patient.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" /><span className="text-sm">{patient.phone}</span></div>}
              {patient.birthdate && <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" /><span className="text-sm">{calculateAge(patient.birthdate)} años</span></div>}
              {patient.address && <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" /><span className="text-sm truncate">{patient.address}</span></div>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4 text-center"><p className="text-2xl font-bold">{stats.totalConsultations}</p><p className="text-xs text-gray-500">Consultas</p></div>
        <div className="card p-4 text-center"><p className="text-2xl font-bold">{stats.totalAppointments}</p><p className="text-xs text-gray-500">Citas</p></div>
        <div className="card p-4 text-center"><p className="text-2xl font-bold">{stats.pendingAppointments}</p><p className="text-xs text-gray-500">Pendientes</p></div>
        <div className="card p-4 text-center"><p className="text-2xl font-bold">{stats.totalPhotos}</p><p className="text-xs text-gray-500">Fotos</p></div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button onClick={() => setTab('consultations')} className={`px-4 py-3 text-sm font-medium border-b-2 ${tab === 'consultations' ? 'border-dental-600 text-dental-600' : 'border-transparent text-gray-500'}`}>
          <FileText className="w-4 h-4 inline mr-2" />Consultas ({consultations.length})
        </button>
        <button onClick={() => setTab('appointments')} className={`px-4 py-3 text-sm font-medium border-b-2 ${tab === 'appointments' ? 'border-dental-600 text-dental-600' : 'border-transparent text-gray-500'}`}>
          <Clock className="w-4 h-4 inline mr-2" />Citas ({appointments.length})
        </button>
      </div>

      {tab === 'consultations' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Historial</h2>
            <Link to={`/consultations/new?patient=${id}`} className="btn-primary text-sm"><Plus className="w-4 h-4" />Nueva</Link>
          </div>
          {consultations.length === 0 ? <div className="card p-8 text-center"><FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" /><p className="text-gray-500">Sin consultas</p></div> : (
            <div className="space-y-3">
              {consultations.map((c) => (
                <Link key={c._id} to={`/consultations/${c._id}`} className="card p-4 block hover:shadow-medium">
                  <p className="text-sm text-dental-600 mb-1">{formatDate(c.date, "d 'de' MMMM, yyyy")}</p>
                  <h3 className="font-medium text-charcoal-800">{c.diagnosis || 'Consulta'}</h3>
                  {c.treatment && <p className="text-sm text-gray-500">Tratamiento: {c.treatment}</p>}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'appointments' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Citas</h2>
            <Link to={`/appointments/new?patient=${id}`} className="btn-primary text-sm"><Plus className="w-4 h-4" />Nueva</Link>
          </div>
          {appointments.length === 0 ? <div className="card p-8 text-center"><Clock className="w-12 h-12 mx-auto text-gray-300 mb-3" /><p className="text-gray-500">Sin citas</p></div> : (
            <div className="space-y-3">
              {appointments.map((a) => (
                <div key={a._id} className="card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${a.status === 'done' ? 'bg-green-100' : 'bg-amber-100'}`}>
                      <Clock className={`w-5 h-5 ${a.status === 'done' ? 'text-green-600' : 'text-amber-600'}`} />
                    </div>
                    <div>
                      <p className="font-medium">{formatDateTime(a.date)}</p>
                      <p className="text-sm text-gray-500">{a.type}</p>
                    </div>
                  </div>
                  <span className={`badge ${a.status === 'done' ? 'badge-success' : 'badge-warning'}`}>{a.status === 'done' ? 'Completada' : 'Pendiente'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

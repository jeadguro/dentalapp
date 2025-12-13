// src/pages/PatientDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { patientsAPI } from '../services/api';
import { formatDate, formatDateTime, calculateAge } from '../utils/dateUtils';
import Odontogram from '../components/Odontogram';
import { ArrowLeft, Edit, Mail, Phone, Calendar, MapPin, FileText, Clock, Plus, Image, AlertTriangle, Heart } from 'lucide-react';

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('consultations');
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    patientsAPI.getHistory(id)
      .then(({ data: res }) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-2xl"></div>
          <div className="h-64 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-container text-center py-12">
        <p className="text-gray-500 mb-4">Paciente no encontrado</p>
        <button onClick={() => navigate('/admin/patients')} className="btn-primary">
          Volver a pacientes
        </button>
      </div>
    );
  }

  const { patient, consultations, appointments, stats } = data;

  // Combinar odontogramas de todas las consultas
  const combinedOdontogram = consultations.reduce((acc, c) => {
    if (c.odontogram) {
      Object.entries(c.odontogram).forEach(([tooth, data]) => {
        if (!acc[tooth]) acc[tooth] = {};
        Object.assign(acc[tooth], data);
      });
    }
    return acc;
  }, {});

  // Obtener todas las fotos de las consultas
  const allPhotos = consultations.flatMap(c => 
    (c.photos || []).map(photo => ({
      url: typeof photo === 'string' ? photo : photo.url,
      date: c.date,
      diagnosis: c.diagnosis
    }))
  );

  const statusLabels = {
    pending: { label: 'Pendiente', class: 'badge-warning' },
    confirmed: { label: 'Confirmada', class: 'badge-info' },
    done: { label: 'Completada', class: 'badge-success' },
    cancelled: { label: 'Cancelada', class: 'badge-danger' }
  };

  return (
    <div className="page-container">
      <Link to="/admin/patients" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" />Volver
      </Link>

      {/* Header del paciente */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-teal-100 flex items-center justify-center">
            <span className="text-3xl font-bold text-teal-600">{patient.name?.charAt(0)?.toUpperCase()}</span>
          </div>
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-display font-bold text-gray-900">{patient.name}</h1>
                <p className="text-gray-500">Paciente desde {formatDate(patient.createdAt, "MMMM yyyy")}</p>
                {patient.selfRegistered && (
                  <span className="inline-block mt-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                    Auto-registrado
                  </span>
                )}
              </div>
              <Link to={`/admin/patients/${id}/edit`} className="btn-secondary">
                <Edit className="w-4 h-4" />Editar
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              {patient.email && (
                <a href={`mailto:${patient.email}`} className="flex items-center gap-2 text-sm hover:text-teal-600">
                  <Mail className="w-4 h-4 text-gray-400" />{patient.email}
                </a>
              )}
              {patient.phone && (
                <a href={`tel:${patient.phone}`} className="flex items-center gap-2 text-sm hover:text-teal-600">
                  <Phone className="w-4 h-4 text-gray-400" />{patient.phone}
                </a>
              )}
              {patient.birthdate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />{calculateAge(patient.birthdate)} años
                </div>
              )}
              {patient.address && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="truncate">{patient.address}</span>
                </div>
              )}
            </div>

            {/* Alertas médicas */}
            {(patient.allergies || patient.medicalConditions) && (
              <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center gap-2 text-amber-700 font-medium mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  Información médica importante
                </div>
                {patient.allergies && (
                  <p className="text-sm text-amber-600">
                    <strong>Alergias:</strong> {patient.allergies}
                  </p>
                )}
                {patient.medicalConditions && (
                  <p className="text-sm text-amber-600">
                    <strong>Condiciones:</strong> {patient.medicalConditions}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-teal-600">{stats.totalConsultations}</p>
          <p className="text-xs text-gray-500">Consultas</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.totalAppointments}</p>
          <p className="text-xs text-gray-500">Citas</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{stats.pendingAppointments}</p>
          <p className="text-xs text-gray-500">Pendientes</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{stats.totalPhotos}</p>
          <p className="text-xs text-gray-500">Fotos</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        <button 
          onClick={() => setTab('consultations')} 
          className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${tab === 'consultations' ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <FileText className="w-4 h-4 inline mr-2" />Consultas
        </button>
        <button 
          onClick={() => setTab('appointments')} 
          className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${tab === 'appointments' ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <Clock className="w-4 h-4 inline mr-2" />Citas
        </button>
        <button 
          onClick={() => setTab('odontogram')} 
          className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${tab === 'odontogram' ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          🦷 Odontograma
        </button>
        <button 
          onClick={() => setTab('photos')} 
          className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${tab === 'photos' ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <Image className="w-4 h-4 inline mr-2" />Fotos
        </button>
      </div>

      {/* Tab: Consultas */}
      {tab === 'consultations' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Historial de consultas</h2>
            <Link to={`/admin/consultations/new?patient=${id}`} className="btn-primary text-sm">
              <Plus className="w-4 h-4" />Nueva consulta
            </Link>
          </div>
          {consultations.length === 0 ? (
            <div className="card p-8 text-center">
              <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Sin consultas registradas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {consultations.map((c) => (
                <Link 
                  key={c._id} 
                  to={`/admin/consultations/${c._id}`} 
                  className="card p-4 block hover:shadow-medium transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-teal-600 mb-1">
                        {formatDate(c.date, "d 'de' MMMM, yyyy")}
                      </p>
                      <h3 className="font-medium text-gray-800">{c.diagnosis || 'Consulta'}</h3>
                      {c.treatment && (
                        <p className="text-sm text-gray-500 mt-1">Tratamiento: {c.treatment}</p>
                      )}
                      {c.doctor && (
                        <p className="text-xs text-gray-400 mt-1">Dr. {c.doctor.name}</p>
                      )}
                    </div>
                    {c.photos?.length > 0 && (
                      <span className="badge-info text-xs">
                        <Image className="w-3 h-3 mr-1" />{c.photos.length}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Citas */}
      {tab === 'appointments' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Citas</h2>
            <Link to={`/admin/appointments/new?patient=${id}`} className="btn-primary text-sm">
              <Plus className="w-4 h-4" />Nueva cita
            </Link>
          </div>
          {appointments.length === 0 ? (
            <div className="card p-8 text-center">
              <Clock className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Sin citas registradas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((a) => (
                <div key={a._id} className="card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${
                      a.status === 'done' ? 'bg-green-100' : 
                      a.status === 'cancelled' ? 'bg-red-100' : 
                      'bg-amber-100'
                    }`}>
                      <Clock className={`w-5 h-5 ${
                        a.status === 'done' ? 'text-green-600' : 
                        a.status === 'cancelled' ? 'text-red-600' : 
                        'text-amber-600'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium">{formatDateTime(a.date)}</p>
                      <p className="text-sm text-gray-500">{a.type || 'Consulta general'}</p>
                      {a.doctor && (
                        <p className="text-xs text-gray-400">Dr. {a.doctor.name}</p>
                      )}
                    </div>
                  </div>
                  <span className={statusLabels[a.status]?.class || 'badge'}>
                    {statusLabels[a.status]?.label || a.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Odontograma */}
      {tab === 'odontogram' && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Odontograma combinado</h2>
          {Object.keys(combinedOdontogram).length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-gray-500">No hay registros de odontograma</p>
            </div>
          ) : (
            <div className="card p-6">
              <Odontogram value={combinedOdontogram} readOnly={true} />
            </div>
          )}
        </div>
      )}

      {/* Tab: Fotos */}
      {tab === 'photos' && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Galería de fotos</h2>
          {allPhotos.length === 0 ? (
            <div className="card p-8 text-center">
              <Image className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Sin fotos registradas</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {allPhotos.map((photo, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedPhoto(photo.url)}
                  className="relative group focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-xl overflow-hidden"
                >
                  <img 
                    src={photo.url} 
                    alt={`Foto ${i + 1}`} 
                    className="w-full aspect-square object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                    <div className="text-white text-xs">
                      <p>{formatDate(photo.date, 'd MMM yyyy')}</p>
                      <p className="truncate">{photo.diagnosis}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lightbox */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <img 
            src={selectedPhoto} 
            alt="Foto ampliada" 
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );
}

// src/pages/patient/PatientPortal.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { patientsAPI, patientAppointmentsAPI } from '../../services/api';
import { formatDate, formatFriendlyDate, calculateAge, toDate } from '../../utils/dateUtils';
import { User, Mail, Phone, Calendar, FileText, LogOut, Image, ChevronRight, X, ChevronLeft, Plus, Clock, AlertCircle } from 'lucide-react';
import Odontogram from '../../components/Odontogram';

export default function PatientPortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('upcoming');
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [lightbox, setLightbox] = useState({ open: false, index: 0, photos: [] });
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const { data: res } = await patientsAPI.getHistory(user.id);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => { 
    logout(); 
    navigate('/portal/login'); 
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!confirm('¿Estás seguro de cancelar esta cita?')) return;
    
    setCancellingId(appointmentId);
    try {
      await patientAppointmentsAPI.cancel(appointmentId, 'Cancelada por el paciente');
      loadData(); // Recargar datos
    } catch (err) {
      alert(err.response?.data?.message || 'Error al cancelar');
    } finally {
      setCancellingId(null);
    }
  };

  const getCombinedOdontogram = () => {
    if (!data?.consultations) return {};
    const combined = {};
    [...data.consultations].reverse().forEach(consultation => {
      if (consultation.odontogram && typeof consultation.odontogram === 'object') {
        Object.entries(consultation.odontogram).forEach(([tooth, surfaces]) => {
          if (!combined[tooth]) combined[tooth] = {};
          if (typeof surfaces === 'object') {
            Object.entries(surfaces).forEach(([surface, condition]) => {
              combined[tooth][surface] = condition;
            });
          }
        });
      }
    });
    return combined;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 animate-pulse" />
          <p className="text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <User className="w-20 h-20 mx-auto text-gray-300 mb-6" />
          <h1 className="text-2xl font-bold mb-3">Perfil no encontrado</h1>
          <p className="text-gray-600 mb-6">No se encontró tu información.</p>
          <button onClick={handleLogout} className="px-4 py-2 bg-gray-200 rounded-lg">
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  const { patient, consultations, appointments, stats } = data;
  const upcoming = appointments.filter(a => ['pending', 'confirmed'].includes(a.status) && toDate(a.date) > new Date());
  const combinedOdontogram = getCombinedOdontogram();
  const hasOdontogramData = Object.keys(combinedOdontogram).length > 0;

  const openLightbox = (photos, idx) => setLightbox({ open: true, index: idx, photos });
  const closeLightbox = () => setLightbox({ open: false, index: 0, photos: [] });

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2c-3 0-5 1.6-6 4-.6 1.6-.4 3.6.4 5.6.6 1.6 1 3.6 1.6 6.4.2.8 1 1.2 1.6.8.4-.2.6-.6.8-1.2l1.2-5c.2-.6.6-1 1.2-1s1 .4 1.2 1l1.2 5c.2.6.4 1 .8 1.2.6.4 1.4 0 1.6-.8.6-2.8 1-4.8 1.6-6.4.8-2 1-4 .4-5.6-1-2.4-3-4-6-4h-1.6z"/>
              </svg>
            </div>
            <span className="font-bold text-gray-900">Mi Portal Dental</span>
          </div>
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
            <LogOut className="w-4 h-4" /> Salir
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Perfil + Botón agendar */}
        <div className="card p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-teal-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-teal-600">
                  {patient.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">¡Hola, {patient.name?.split(' ')[0]}!</h1>
                <p className="text-gray-500">Bienvenido a tu portal</p>
              </div>
            </div>
            <Link
              to="/portal/book"
              className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Agendar Cita
            </Link>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-teal-600">{stats.totalConsultations}</p>
              <p className="text-xs text-gray-500">Consultas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{upcoming.length}</p>
              <p className="text-xs text-gray-500">Citas pendientes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.totalPhotos}</p>
              <p className="text-xs text-gray-500">Fotografías</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">{patient.birthdate ? calculateAge(patient.birthdate) : '-'}</p>
              <p className="text-xs text-gray-500">Años</p>
            </div>
          </div>
        </div>

        {/* Info Personal */}
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-teal-600" /> Mi Información
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {patient.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <span>{patient.email}</span>
              </div>
            )}
            {patient.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <span>{patient.phone}</span>
              </div>
            )}
            {patient.birthdate && (
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span>{formatDate(patient.birthdate, "d 'de' MMMM, yyyy")}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
          {[
            { id: 'upcoming', label: 'Mis Citas', count: upcoming.length },
            { id: 'odontogram', label: '🦷 Odontograma' },
            { id: 'history', label: 'Historial', count: consultations.length },
            { id: 'photos', label: 'Fotos', count: stats.totalPhotos }
          ].map(t => (
            <button 
              key={t.id} 
              onClick={() => setTab(t.id)} 
              className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                tab === t.id ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label} {t.count !== undefined && `(${t.count})`}
            </button>
          ))}
        </div>

        {/* Tab: Mis Citas */}
        {tab === 'upcoming' && (
          <div className="space-y-4">
            {upcoming.length === 0 ? (
              <div className="card p-8 text-center">
                <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 mb-4">No tienes citas pendientes</p>
                <Link to="/portal/book" className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm">
                  <Plus className="w-4 h-4" /> Agendar Cita
                </Link>
              </div>
            ) : (
              upcoming.map(apt => (
                <div key={apt._id} className="card p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-14 text-center p-2 rounded-xl bg-teal-100 flex-shrink-0">
                      <p className="text-xl font-bold text-teal-700">{formatDate(apt.date, 'd')}</p>
                      <p className="text-xs text-teal-600 uppercase">{formatDate(apt.date, 'MMM')}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold">{apt.type === 'checkup' ? 'Revisión general' : apt.type === 'cleaning' ? 'Limpieza' : apt.type}</p>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatDate(apt.date, 'HH:mm')} hrs
                          </p>
                          {apt.doctor && (
                            <p className="text-sm text-gray-600 mt-1">
                              <User className="w-4 h-4 inline mr-1" />
                              Dr. {apt.doctor.name}
                              {apt.doctor.specialty && <span className="text-gray-400"> • {apt.doctor.specialty}</span>}
                            </p>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          apt.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {apt.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCancelAppointment(apt._id)}
                        disabled={cancellingId === apt._id}
                        className="mt-3 text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                      >
                        {cancellingId === apt._id ? 'Cancelando...' : (
                          <><X className="w-4 h-4" /> Cancelar cita</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab: Odontograma */}
        {tab === 'odontogram' && (
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">🦷 Mi Estado Dental</h2>
            {hasOdontogramData ? (
              <Odontogram value={combinedOdontogram} readOnly={true} />
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-4xl">🦷</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Sin registros</h3>
                <p className="text-gray-500">Tu odontograma se actualizará después de tu próxima consulta.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab: Historial */}
        {tab === 'history' && (
          <div className="space-y-4">
            {consultations.length === 0 ? (
              <div className="card p-8 text-center">
                <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">Sin consultas registradas</p>
              </div>
            ) : (
              consultations.map(c => (
                <div 
                  key={c._id} 
                  className="card p-4 cursor-pointer hover:shadow-md transition-shadow" 
                  onClick={() => setSelectedConsultation(selectedConsultation?._id === c._id ? null : c)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 text-center p-2 rounded-xl bg-blue-100">
                        <p className="text-xl font-bold text-blue-700">{formatDate(c.date, 'd')}</p>
                        <p className="text-xs text-blue-600 uppercase">{formatDate(c.date, 'MMM')}</p>
                      </div>
                      <div>
                        <p className="font-semibold">{c.diagnosis || 'Consulta'}</p>
                        <p className="text-sm text-gray-500">{c.treatment || 'Sin tratamiento'}</p>
                        {c.doctor && (
                          <p className="text-xs text-gray-400 mt-1">Dr. {c.doctor.name}</p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${
                      selectedConsultation?._id === c._id ? 'rotate-90' : ''
                    }`} />
                  </div>
                  
                  {selectedConsultation?._id === c._id && (
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                      {c.notes && <p className="text-sm text-gray-600">{c.notes}</p>}
                      
                      {c.odontogram && Object.keys(c.odontogram).length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Odontograma:</p>
                          <Odontogram value={c.odontogram} readOnly={true} />
                        </div>
                      )}
                      
                      {c.photos?.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Fotos:</p>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {c.photos.map((p, i) => (
                              <button 
                                key={i} 
                                onClick={(e) => { e.stopPropagation(); openLightbox(c.photos.map(x => x.url || x), i); }} 
                                className="aspect-square rounded-lg overflow-hidden"
                              >
                                <img src={p.url || p} alt="" className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab: Fotos */}
        {tab === 'photos' && (
          <div>
            {consultations.every(c => !c.photos?.length) ? (
              <div className="card p-8 text-center">
                <Image className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">Sin fotografías</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {consultations.flatMap((c, ci) => 
                  (c.photos || []).map((p, pi) => (
                    <button 
                      key={`${ci}-${pi}`} 
                      onClick={() => openLightbox(c.photos.map(x => x.url || x), pi)} 
                      className="aspect-square rounded-xl overflow-hidden group"
                    >
                      <img src={p.url || p} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Lightbox */}
      {lightbox.open && lightbox.photos.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={closeLightbox}>
          <button onClick={closeLightbox} className="absolute top-4 right-4 p-2 text-white/80 hover:text-white">
            <X className="w-8 h-8" />
          </button>
          {lightbox.photos.length > 1 && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); setLightbox(prev => ({...prev, index: prev.index === 0 ? prev.photos.length - 1 : prev.index - 1})); }} 
                className="absolute left-4 p-2 text-white/80 hover:text-white"
              >
                <ChevronLeft className="w-10 h-10" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setLightbox(prev => ({...prev, index: (prev.index + 1) % prev.photos.length})); }} 
                className="absolute right-4 p-2 text-white/80 hover:text-white"
              >
                <ChevronRight className="w-10 h-10" />
              </button>
            </>
          )}
          <img src={lightbox.photos[lightbox.index]} alt="" className="max-w-[90vw] max-h-[90vh] object-contain" onClick={(e) => e.stopPropagation()} />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80">
            {lightbox.index + 1} / {lightbox.photos.length}
          </div>
        </div>
      )}
    </div>
  );
}

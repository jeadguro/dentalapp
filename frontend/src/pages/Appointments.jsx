// src/pages/Appointments.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { appointmentsAPI } from '../services/api';
import { formatDate, formatDateTime, toDate } from '../utils/dateUtils';
import Modal, { ModalFooter } from '../components/Modal';
import { 
  Search, Plus, Calendar, Clock, CheckCircle, XCircle, Trash2, 
  User, Phone, Mail, FileText, ChevronDown, ChevronUp, 
  Stethoscope, AlertCircle
} from 'lucide-react';

const TYPE_LABELS = { 
  checkup: 'Revisión general', 
  cleaning: 'Limpieza dental', 
  filling: 'Empaste', 
  extraction: 'Extracción', 
  rootcanal: 'Endodoncia', 
  crown: 'Corona', 
  whitening: 'Blanqueamiento', 
  orthodontics: 'Ortodoncia', 
  implant: 'Implante', 
  emergency: 'Urgencia', 
  other: 'Otro' 
};

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ open: false, item: null });
  const [actionLoading, setActionLoading] = useState(null);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const { data } = await appointmentsAPI.getAll();
      setAppointments(data.data.appointments);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleComplete = async (apt, e) => {
    e.stopPropagation();
    setActionLoading(apt._id);
    try {
      await appointmentsAPI.complete(apt._id);
      setAppointments(prev => prev.map(a => a._id === apt._id ? {...a, status: 'done'} : a));
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  const handleCancel = async (apt, e) => {
    e.stopPropagation();
    setActionLoading(apt._id);
    try {
      await appointmentsAPI.cancel(apt._id);
      setAppointments(prev => prev.map(a => a._id === apt._id ? {...a, status: 'cancelled'} : a));
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  const handleDelete = async () => {
    try {
      await appointmentsAPI.delete(deleteModal.item._id);
      setAppointments(prev => prev.filter(a => a._id !== deleteModal.item._id));
      setDeleteModal({ open: false, item: null });
      if (expanded === deleteModal.item._id) setExpanded(null);
    } catch (e) { console.error(e); }
  };

  const toggleExpand = (id) => {
    setExpanded(expanded === id ? null : id);
  };

  const filtered = appointments.filter(a => {
    const matchSearch = !search || 
      a.patient?.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.doctor?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Agrupar por fecha
  const groupedByDate = filtered.reduce((acc, apt) => {
    const dateKey = formatDate(apt.date, 'yyyy-MM-dd');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(apt);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a));

  if (loading) return (
    <div className="page-container">
      <div className="animate-pulse space-y-4">
        {[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>)}
      </div>
    </div>
  );

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title">Citas</h1>
          <p className="text-gray-500">{appointments.length} registradas</p>
        </div>
        <Link to="/admin/appointments/new" className="btn-primary">
          <Plus className="w-5 h-5" />Nueva Cita
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Buscar paciente o doctor..." 
            className="input-field pl-12" 
          />
        </div>
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)} 
          className="input-field w-full sm:w-48"
        >
          <option value="all">Todos los estados</option>
          <option value="pending">Pendientes</option>
          <option value="confirmed">Confirmadas</option>
          <option value="done">Completadas</option>
          <option value="cancelled">Canceladas</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No hay citas</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map(dateKey => {
            const dayAppointments = groupedByDate[dateKey];
            const dateObj = new Date(dateKey);
            const isToday = formatDate(new Date(), 'yyyy-MM-dd') === dateKey;
            const isTomorrow = formatDate(new Date(Date.now() + 86400000), 'yyyy-MM-dd') === dateKey;
            
            return (
              <div key={dateKey}>
                {/* Encabezado de fecha */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
                    isToday ? 'bg-teal-100 text-teal-700' : 
                    isTomorrow ? 'bg-blue-100 text-blue-700' : 
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {isToday ? 'Hoy' : isTomorrow ? 'Mañana' : formatDate(dateObj, "EEEE d 'de' MMMM")}
                  </div>
                  <span className="text-sm text-gray-400">{dayAppointments.length} cita(s)</span>
                </div>

                {/* Lista de citas del día */}
                <div className="space-y-3">
                  {dayAppointments.sort((a, b) => new Date(a.date) - new Date(b.date)).map((apt) => {
                    const isPending = apt.status === 'pending' || apt.status === 'confirmed';
                    const isExpanded = expanded === apt._id;
                    const date = toDate(apt.date);
                    const isPast = date && date < new Date();
                    
                    return (
                      <div 
                        key={apt._id} 
                        className={`card overflow-hidden transition-all ${isExpanded ? 'ring-2 ring-teal-500' : ''}`}
                      >
                        {/* Fila principal - clickeable */}
                        <div 
                          onClick={() => toggleExpand(apt._id)}
                          className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            {/* Hora */}
                            <div className={`w-16 text-center p-2 rounded-xl ${
                              apt.status === 'done' ? 'bg-green-100' : 
                              apt.status === 'cancelled' ? 'bg-red-100' : 
                              isPast ? 'bg-amber-100' : 'bg-teal-100'
                            }`}>
                              <p className={`text-xl font-bold ${
                                apt.status === 'done' ? 'text-green-700' : 
                                apt.status === 'cancelled' ? 'text-red-700' : 
                                isPast ? 'text-amber-700' : 'text-teal-700'
                              }`}>
                                {formatDate(apt.date, 'HH:mm')}
                              </p>
                              <p className={`text-xs ${
                                apt.status === 'done' ? 'text-green-600' : 
                                apt.status === 'cancelled' ? 'text-red-600' : 
                                isPast ? 'text-amber-600' : 'text-teal-600'
                              }`}>
                                hrs
                              </p>
                            </div>

                            {/* Info principal */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-semibold text-gray-800">
                                  {apt.patient?.name || 'Paciente'}
                                </span>
                                <span className={`badge ${
                                  apt.status === 'done' ? 'badge-success' : 
                                  apt.status === 'cancelled' ? 'bg-red-100 text-red-700' : 
                                  apt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                  'badge-warning'
                                }`}>
                                  {apt.status === 'done' ? 'Completada' : 
                                   apt.status === 'cancelled' ? 'Cancelada' : 
                                   apt.status === 'confirmed' ? 'Confirmada' :
                                   'Pendiente'}
                                </span>
                                {apt.createdByPatient && (
                                  <span className="badge bg-purple-100 text-purple-700">
                                    Agendó paciente
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">
                                <Stethoscope className="w-4 h-4 inline mr-1" />
                                {TYPE_LABELS[apt.type] || apt.type}
                                {apt.doctor && (
                                  <span className="text-gray-400"> • Dr. {apt.doctor.name}</span>
                                )}
                              </p>
                            </div>

                            {/* Acciones rápidas y expand */}
                            <div className="flex items-center gap-2">
                              {isPending && !isExpanded && (
                                <button 
                                  onClick={(e) => handleComplete(apt, e)} 
                                  disabled={actionLoading === apt._id} 
                                  className="p-2 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors" 
                                  title="Marcar completada"
                                >
                                  <CheckCircle className="w-5 h-5" />
                                </button>
                              )}
                              <div className={`p-2 rounded-full ${isExpanded ? 'bg-teal-100' : ''}`}>
                                {isExpanded ? 
                                  <ChevronUp className="w-5 h-5 text-teal-600" /> : 
                                  <ChevronDown className="w-5 h-5 text-gray-400" />
                                }
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Panel expandido con detalles */}
                        {isExpanded && (
                          <div className="border-t border-gray-100 bg-gray-50 p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Información del paciente */}
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                  <User className="w-4 h-4" /> Paciente
                                </h4>
                                <div className="bg-white rounded-lg p-4 space-y-2">
                                  <p className="font-medium text-gray-900">{apt.patient?.name}</p>
                                  {apt.patient?.phone && (
                                    <p className="text-sm text-gray-600 flex items-center gap-2">
                                      <Phone className="w-4 h-4 text-gray-400" />
                                      <a href={`tel:${apt.patient.phone}`} className="hover:text-teal-600">
                                        {apt.patient.phone}
                                      </a>
                                    </p>
                                  )}
                                  {apt.patient?.email && (
                                    <p className="text-sm text-gray-600 flex items-center gap-2">
                                      <Mail className="w-4 h-4 text-gray-400" />
                                      <a href={`mailto:${apt.patient.email}`} className="hover:text-teal-600">
                                        {apt.patient.email}
                                      </a>
                                    </p>
                                  )}
                                  <Link 
                                    to={`/admin/patients/${apt.patient?._id}`}
                                    className="inline-block mt-2 text-sm text-teal-600 hover:text-teal-700"
                                  >
                                    Ver historial completo →
                                  </Link>
                                </div>
                              </div>

                              {/* Detalles de la cita */}
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                  <Calendar className="w-4 h-4" /> Detalles de la cita
                                </h4>
                                <div className="bg-white rounded-lg p-4 space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Tipo:</span>
                                    <span className="text-sm font-medium">{TYPE_LABELS[apt.type] || apt.type}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Fecha:</span>
                                    <span className="text-sm font-medium">{formatDate(apt.date, "d 'de' MMMM, yyyy")}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Hora:</span>
                                    <span className="text-sm font-medium">{formatDate(apt.date, 'HH:mm')} hrs</span>
                                  </div>
                                  {apt.endDate && (
                                    <div className="flex justify-between">
                                      <span className="text-sm text-gray-500">Duración estimada:</span>
                                      <span className="text-sm font-medium">
                                        {Math.round((new Date(apt.endDate) - new Date(apt.date)) / 60000)} min
                                      </span>
                                    </div>
                                  )}
                                  {apt.doctor && (
                                    <div className="flex justify-between">
                                      <span className="text-sm text-gray-500">Doctor:</span>
                                      <span className="text-sm font-medium">
                                        Dr. {apt.doctor.name}
                                        {apt.doctor.specialty && (
                                          <span className="text-gray-400 font-normal"> ({apt.doctor.specialty})</span>
                                        )}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Notas */}
                            {apt.notes && (
                              <div className="mt-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                  <FileText className="w-4 h-4" /> Notas
                                </h4>
                                <div className="bg-white rounded-lg p-4">
                                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{apt.notes}</p>
                                </div>
                              </div>
                            )}

                            {/* Alerta si fue agendada por paciente */}
                            {apt.createdByPatient && (
                              <div className="mt-4 p-3 bg-purple-50 rounded-lg flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-purple-800">Cita agendada por el paciente</p>
                                  <p className="text-xs text-purple-600">El paciente agendó esta cita desde su portal.</p>
                                </div>
                              </div>
                            )}

                            {/* Acciones */}
                            <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
                              {isPending && (
                                <>
                                  <button 
                                    onClick={(e) => handleComplete(apt, e)} 
                                    disabled={actionLoading === apt._id}
                                    className="btn-primary text-sm py-2"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Marcar completada
                                  </button>
                                  <button 
                                    onClick={(e) => handleCancel(apt, e)} 
                                    disabled={actionLoading === apt._id}
                                    className="btn-secondary text-sm py-2"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    Cancelar cita
                                  </button>
                                </>
                              )}
                              <Link 
                                to={`/admin/consultations/new?patient=${apt.patient?._id}&appointment=${apt._id}`}
                                className="btn-secondary text-sm py-2"
                              >
                                <FileText className="w-4 h-4" />
                                Crear consulta
                              </Link>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setDeleteModal({ open: true, item: apt }); }}
                                className="btn-secondary text-sm py-2 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                                Eliminar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false, item: null })} title="Eliminar Cita">
        <p className="text-gray-600">¿Estás seguro de eliminar esta cita?</p>
        {deleteModal.item && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <p className="font-medium">{deleteModal.item.patient?.name}</p>
            <p className="text-sm text-gray-500">{formatDateTime(deleteModal.item.date)}</p>
          </div>
        )}
        <ModalFooter>
          <button onClick={() => setDeleteModal({ open: false, item: null })} className="btn-secondary">Cancelar</button>
          <button onClick={handleDelete} className="btn-danger">Eliminar</button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

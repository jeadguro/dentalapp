// src/pages/Appointments.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { appointmentsAPI } from '../services/api';
import { formatDate, formatDateTime, toDate } from '../utils/dateUtils';
import Modal, { ModalFooter } from '../components/Modal';
import { Search, Plus, Calendar, Clock, CheckCircle, XCircle, Trash2 } from 'lucide-react';

const TYPE_LABELS = { checkup: 'Revisión', cleaning: 'Limpieza', filling: 'Empaste', extraction: 'Extracción', rootcanal: 'Endodoncia', crown: 'Corona', whitening: 'Blanqueamiento', orthodontics: 'Ortodoncia', implant: 'Implante', emergency: 'Urgencia', other: 'Otro' };

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ open: false, item: null });
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const { data } = await appointmentsAPI.getAll();
      setAppointments(data.data.appointments);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleComplete = async (apt) => {
    setActionLoading(apt._id);
    try {
      await appointmentsAPI.complete(apt._id);
      setAppointments(prev => prev.map(a => a._id === apt._id ? {...a, status: 'done'} : a));
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  const handleCancel = async (apt) => {
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
    } catch (e) { console.error(e); }
  };

  const filtered = appointments.filter(a => {
    const matchSearch = !search || a.patient?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) return <div className="page-container"><div className="animate-pulse space-y-4">{[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>)}</div></div>;

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div><h1 className="page-title">Citas</h1><p className="text-gray-500">{appointments.length} registradas</p></div>
        <Link to="/appointments/new" className="btn-primary"><Plus className="w-5 h-5" />Nueva Cita</Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="input-field pl-12" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field w-full sm:w-48">
          <option value="all">Todos</option>
          <option value="pending">Pendientes</option>
          <option value="done">Completadas</option>
          <option value="cancelled">Canceladas</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center"><Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" /><p className="text-gray-500">No hay citas</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((apt) => {
            const isPending = apt.status === 'pending';
            const date = toDate(apt.date);
            const isPast = date && date < new Date();
            return (
              <div key={apt._id} className="card p-4 hover:shadow-medium group">
                <div className="flex items-center gap-4">
                  <div className={`w-16 text-center p-2 rounded-xl ${apt.status === 'done' ? 'bg-green-100' : apt.status === 'cancelled' ? 'bg-red-100' : isPast ? 'bg-amber-100' : 'bg-dental-100'}`}>
                    <p className={`text-2xl font-bold ${apt.status === 'done' ? 'text-green-700' : apt.status === 'cancelled' ? 'text-red-700' : isPast ? 'text-amber-700' : 'text-dental-700'}`}>{formatDate(apt.date, 'd')}</p>
                    <p className={`text-xs uppercase ${apt.status === 'done' ? 'text-green-600' : apt.status === 'cancelled' ? 'text-red-600' : isPast ? 'text-amber-600' : 'text-dental-600'}`}>{formatDate(apt.date, 'MMM')}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link to={`/patients/${apt.patient?._id}`} className="font-semibold text-charcoal-800 hover:text-dental-600">{apt.patient?.name}</Link>
                      <span className={`badge ${apt.status === 'done' ? 'badge-success' : apt.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'badge-warning'}`}>
                        {apt.status === 'done' ? 'Completada' : apt.status === 'cancelled' ? 'Cancelada' : 'Pendiente'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600"><Clock className="w-4 h-4 inline mr-1" />{formatDateTime(apt.date)} • {TYPE_LABELS[apt.type] || apt.type}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isPending && (
                      <>
                        <button onClick={() => handleComplete(apt)} disabled={actionLoading === apt._id} className="p-2 rounded-lg hover:bg-green-50 text-gray-500 hover:text-green-600" title="Completar"><CheckCircle className="w-5 h-5" /></button>
                        <button onClick={() => handleCancel(apt)} disabled={actionLoading === apt._id} className="p-2 rounded-lg hover:bg-amber-50 text-gray-500 hover:text-amber-600" title="Cancelar"><XCircle className="w-5 h-5" /></button>
                      </>
                    )}
                    <button onClick={() => setDeleteModal({ open: true, item: apt })} className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600" title="Eliminar"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false, item: null })} title="Eliminar Cita">
        <p className="text-gray-600">¿Eliminar esta cita?</p>
        <ModalFooter>
          <button onClick={() => setDeleteModal({ open: false, item: null })} className="btn-secondary">Cancelar</button>
          <button onClick={handleDelete} className="btn-danger">Eliminar</button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

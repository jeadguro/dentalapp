// src/pages/Consultations.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { consultationsAPI } from '../services/api';
import { formatDate, formatRelative } from '../utils/dateUtils';
import Modal, { ModalFooter } from '../components/Modal';
import { Search, Plus, FileText, Image, Eye, Trash2, User } from 'lucide-react';

export default function Consultations() {
  const [consultations, setConsultations] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ open: false, item: null });
  const navigate = useNavigate();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const { data } = await consultationsAPI.getAll();
      setConsultations(data.data.consultations);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    try {
      await consultationsAPI.delete(deleteModal.item._id);
      setConsultations(prev => prev.filter(c => c._id !== deleteModal.item._id));
      setDeleteModal({ open: false, item: null });
    } catch (e) { console.error(e); }
  };

  const filtered = consultations.filter(c => 
    !search || 
    c.patient?.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.diagnosis?.toLowerCase().includes(search.toLowerCase()) ||
    c.doctor?.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="page-container">
      <div className="animate-pulse space-y-4">
        {[1,2,3,4,5].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>)}
      </div>
    </div>
  );

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title">Consultas</h1>
          <p className="text-gray-500">{consultations.length} registradas</p>
        </div>
        <Link to="/admin/consultations/new" className="btn-primary">
          <Plus className="w-5 h-5" />Nueva Consulta
        </Link>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input 
          type="text" 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          placeholder="Buscar por paciente, diagnóstico o doctor..." 
          className="input-field pl-12" 
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No hay consultas</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((c) => (
            <div key={c._id} className="card p-5 hover:shadow-medium group">
              <div className="flex items-start gap-4">
                <div className="w-16 text-center bg-teal-100 rounded-xl p-2">
                  <p className="text-2xl font-bold text-teal-700">{formatDate(c.date, 'd')}</p>
                  <p className="text-xs text-teal-600 uppercase">{formatDate(c.date, 'MMM')}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <Link 
                    to={`/admin/patients/${c.patient?._id}`} 
                    className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                  >
                    {c.patient?.name || 'Paciente no asignado'}
                  </Link>
                  <h3 className="font-semibold text-gray-800 mt-1">{c.diagnosis || 'Sin diagnóstico'}</h3>
                  {c.treatment && <p className="text-sm text-gray-600 mt-1">Tratamiento: {c.treatment}</p>}
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    {c.doctor && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Dr. {c.doctor.name}
                      </span>
                    )}
                    {c.photos?.length > 0 && (
                      <span className="badge-info">
                        <Image className="w-3 h-3 mr-1" />{c.photos.length} fotos
                      </span>
                    )}
                    <span className="text-xs text-gray-400">{formatRelative(c.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => navigate(`/admin/consultations/${c._id}`)} 
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                    title="Ver detalles"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setDeleteModal({ open: true, item: c })} 
                    className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600"
                    title="Eliminar"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal 
        isOpen={deleteModal.open} 
        onClose={() => setDeleteModal({ open: false, item: null })} 
        title="Eliminar Consulta"
      >
        <p className="text-gray-600">¿Eliminar esta consulta?</p>
        <p className="text-sm text-red-500 mt-2">Esta acción no se puede deshacer.</p>
        <ModalFooter>
          <button onClick={() => setDeleteModal({ open: false, item: null })} className="btn-secondary">
            Cancelar
          </button>
          <button onClick={handleDelete} className="btn-danger">
            Eliminar
          </button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

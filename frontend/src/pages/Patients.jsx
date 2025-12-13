// src/pages/Patients.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { patientsAPI } from '../services/api';
import { calculateAge } from '../utils/dateUtils';
import Modal, { ModalFooter } from '../components/Modal';
import { Search, UserPlus, Phone, Mail, Calendar, Eye, Edit, Trash2, Users, QrCode, RefreshCw, Shield } from 'lucide-react';

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ open: false, patient: null });
  const [qrModal, setQrModal] = useState({ open: false, data: null, loading: false, patient: null });
  const navigate = useNavigate();

  useEffect(() => { loadPatients(); }, []);

  const loadPatients = async () => {
    try {
      const { data } = await patientsAPI.getAll({ search });
      setPatients(data.data.patients);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    try {
      await patientsAPI.delete(deleteModal.patient._id);
      setPatients(prev => prev.filter(p => p._id !== deleteModal.patient._id));
      setDeleteModal({ open: false, patient: null });
    } catch (e) { console.error(e); }
  };

  const handleShowQR = async (patient) => {
    setQrModal({ open: true, data: null, loading: true, patient });
    try {
      const { data } = await patientsAPI.getQR(patient._id);
      setQrModal(prev => ({ ...prev, data: data.data, loading: false }));
    } catch (e) { 
      console.error(e);
      setQrModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleRegenerateAccess = async () => {
    if (!qrModal.patient) return;
    setQrModal(prev => ({ ...prev, loading: true }));
    try {
      const { data } = await patientsAPI.regenerateAccess(qrModal.patient._id);
      // Recargar QR después de regenerar
      const qrData = await patientsAPI.getQR(qrModal.patient._id);
      setQrModal(prev => ({ ...prev, data: qrData.data.data, loading: false }));
    } catch (e) { 
      console.error(e);
      setQrModal(prev => ({ ...prev, loading: false }));
    }
  };

  const filtered = patients.filter(p => 
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase())
  );

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
          <h1 className="page-title">Pacientes</h1>
          <p className="text-gray-500">{patients.length} registrados</p>
        </div>
        <Link to="/admin/patients/new" className="btn-primary">
          <UserPlus className="w-5 h-5" />Nuevo Paciente
        </Link>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input 
          type="text" 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          placeholder="Buscar por nombre o email..." 
          className="input-field pl-12" 
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No hay pacientes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((patient) => (
            <div key={patient._id} className="card p-4 hover:shadow-medium group">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-teal-100 flex items-center justify-center relative">
                  <span className="text-xl font-semibold text-teal-600">
                    {patient.name?.charAt(0)?.toUpperCase()}
                  </span>
                  {patient.selfRegistered && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center" title="Se registró solo">
                      <Shield className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800 truncate">{patient.name}</h3>
                    {patient.selfRegistered && (
                      <span className="badge bg-purple-100 text-purple-700 text-xs">Auto-registro</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                    {patient.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />{patient.email}
                      </span>
                    )}
                    {patient.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />{patient.phone}
                      </span>
                    )}
                    {patient.birthdate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />{calculateAge(patient.birthdate)} años
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleShowQR(patient)} 
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" 
                    title="Código de acceso"
                  >
                    <QrCode className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => navigate(`/admin/patients/${patient._id}`)} 
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" 
                    title="Ver historial"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => navigate(`/admin/patients/${patient._id}/edit`)} 
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" 
                    title="Editar"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setDeleteModal({ open: true, patient })} 
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

      {/* Modal Eliminar */}
      <Modal 
        isOpen={deleteModal.open} 
        onClose={() => setDeleteModal({ open: false, patient: null })} 
        title="Eliminar Paciente"
      >
        <p className="text-gray-600">¿Eliminar a <strong>{deleteModal.patient?.name}</strong>?</p>
        <p className="text-sm text-red-500 mt-2">Esta acción eliminará también todo su historial.</p>
        <ModalFooter>
          <button onClick={() => setDeleteModal({ open: false, patient: null })} className="btn-secondary">
            Cancelar
          </button>
          <button onClick={handleDelete} className="btn-danger">
            Eliminar
          </button>
        </ModalFooter>
      </Modal>

      {/* Modal QR / Código de Acceso */}
      <Modal 
        isOpen={qrModal.open} 
        onClose={() => setQrModal({ open: false, data: null, loading: false, patient: null })} 
        title="Acceso del Paciente"
      >
        {qrModal.loading ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500">Cargando...</p>
          </div>
        ) : qrModal.data ? (
          <div className="text-center">
            <p className="font-semibold text-gray-800 mb-4">{qrModal.data.patient?.name}</p>
            
            {qrModal.data.qr ? (
              <>
                <img src={qrModal.data.qr} alt="QR" className="mx-auto mb-4 rounded-xl" />
                <p className="text-sm text-gray-500 mb-2">Código de acceso:</p>
                <p className="text-3xl font-mono font-bold text-teal-600 tracking-widest mb-4">
                  {qrModal.data.accessCode}
                </p>
                <p className="text-xs text-gray-400 mb-4">
                  El paciente puede usar este código para acceder a su portal
                </p>
              </>
            ) : (
              <div className="bg-amber-50 rounded-lg p-4 mb-4">
                <p className="text-amber-800 font-medium mb-2">Sin código de acceso</p>
                <p className="text-sm text-amber-600">
                  {qrModal.patient?.selfRegistered 
                    ? 'Este paciente se registró con email y contraseña. Puede generar un código de acceso adicional.'
                    : 'Este paciente no tiene código de acceso generado.'}
                </p>
              </div>
            )}

            <button 
              onClick={handleRegenerateAccess}
              disabled={qrModal.loading}
              className="btn-secondary text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${qrModal.loading ? 'animate-spin' : ''}`} />
              {qrModal.data.accessCode ? 'Regenerar código' : 'Generar código de acceso'}
            </button>

            {qrModal.data.accessLink && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Link de acceso directo:</p>
                <p className="text-xs text-teal-600 break-all font-mono">{qrModal.data.accessLink}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Error al cargar datos</p>
            <button 
              onClick={() => handleShowQR(qrModal.patient)}
              className="btn-secondary mt-4"
            >
              Reintentar
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}

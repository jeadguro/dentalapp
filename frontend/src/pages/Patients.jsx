// src/pages/Patients.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { patientsAPI } from '../services/api';
import { calculateAge } from '../utils/dateUtils';
import Modal, { ModalFooter } from '../components/Modal';
import { Search, UserPlus, Phone, Mail, Calendar, Eye, Edit, Trash2, Users, QrCode } from 'lucide-react';

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ open: false, patient: null });
  const [qrModal, setQrModal] = useState({ open: false, data: null });
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
    try {
      const { data } = await patientsAPI.getQR(patient._id);
      setQrModal({ open: true, data: data.data });
    } catch (e) { console.error(e); }
  };

  const filtered = patients.filter(p => 
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="page-container"><div className="animate-pulse space-y-4">{[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>)}</div></div>;

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div><h1 className="page-title">Pacientes</h1><p className="text-gray-500">{patients.length} registrados</p></div>
        <Link to="/patients/new" className="btn-primary"><UserPlus className="w-5 h-5" />Nuevo Paciente</Link>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="input-field pl-12" />
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center"><Users className="w-16 h-16 mx-auto text-gray-300 mb-4" /><p className="text-gray-500">No hay pacientes</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((patient) => (
            <div key={patient._id} className="card p-4 hover:shadow-medium group">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-dental-100 flex items-center justify-center">
                  <span className="text-xl font-semibold text-dental-600">{patient.name?.charAt(0)?.toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-charcoal-800 truncate">{patient.name}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                    {patient.email && <span className="flex items-center gap-1"><Mail className="w-4 h-4" />{patient.email}</span>}
                    {patient.phone && <span className="flex items-center gap-1"><Phone className="w-4 h-4" />{patient.phone}</span>}
                    {patient.birthdate && <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{calculateAge(patient.birthdate)} años</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleShowQR(patient)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="QR"><QrCode className="w-5 h-5" /></button>
                  <button onClick={() => navigate(`/patients/${patient._id}`)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="Ver"><Eye className="w-5 h-5" /></button>
                  <button onClick={() => navigate(`/patients/${patient._id}/edit`)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="Editar"><Edit className="w-5 h-5" /></button>
                  <button onClick={() => setDeleteModal({ open: true, patient })} className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600" title="Eliminar"><Trash2 className="w-5 h-5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false, patient: null })} title="Eliminar Paciente">
        <p className="text-gray-600">¿Eliminar a <strong>{deleteModal.patient?.name}</strong>?</p>
        <ModalFooter>
          <button onClick={() => setDeleteModal({ open: false, patient: null })} className="btn-secondary">Cancelar</button>
          <button onClick={handleDelete} className="btn-danger">Eliminar</button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={qrModal.open} onClose={() => setQrModal({ open: false, data: null })} title="Código de Acceso">
        {qrModal.data && (
          <div className="text-center">
            <p className="font-semibold text-charcoal-800 mb-4">{qrModal.data.patient.name}</p>
            <img src={qrModal.data.qr} alt="QR" className="mx-auto mb-4 rounded-xl" />
            <p className="text-sm text-gray-500 mb-2">Código de acceso:</p>
            <p className="text-3xl font-mono font-bold text-dental-600 tracking-widest">{qrModal.data.accessCode}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}

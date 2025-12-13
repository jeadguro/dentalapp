// src/pages/ConsultationView.jsx
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { consultationsAPI } from "../services/api";
import { formatDate } from "../utils/dateUtils";
import { ArrowLeft, Calendar, Image, User, Edit, DollarSign } from "lucide-react";
import Odontogram from "../components/Odontogram";

export default function ConsultationView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [consultation, setConsultation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    loadConsultation();
  }, [id]);

  const loadConsultation = async () => {
    try {
      const { data } = await consultationsAPI.getOne(id);
      const result = data.data?.consultation || data.consultation || data;
      setConsultation(result);
    } catch (err) {
      console.error("Error cargando consulta:", err);
      setError(err.response?.data?.message || "Error al cargar la consulta");
    } finally {
      setLoading(false);
    }
  };

  // Obtener URL de foto (puede ser string o objeto)
  const getPhotoUrl = (photo) => {
    if (typeof photo === 'string') return photo;
    return photo?.url || photo;
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !consultation) {
    return (
      <div className="page-container">
        <div className="card p-8 text-center">
          <p className="text-red-500 mb-4">{error || "Consulta no encontrada"}</p>
          <button onClick={() => navigate("/admin/consultations")} className="btn-primary">
            Volver a consultas
          </button>
        </div>
      </div>
    );
  }

  const paymentStatusLabels = {
    pending: { label: 'Pendiente', class: 'bg-amber-100 text-amber-700' },
    partial: { label: 'Parcial', class: 'bg-blue-100 text-blue-700' },
    paid: { label: 'Pagado', class: 'bg-green-100 text-green-700' }
  };

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/admin/consultations")}
          className="btn-secondary flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        <Link
          to={`/admin/consultations/${consultation._id}/edit`}
          className="btn-primary"
        >
          <Edit className="w-4 h-4" />
          Editar
        </Link>
      </div>

      {/* Info Card */}
      <div className="card p-6 space-y-6">
        <h1 className="page-title">Detalles de la Consulta</h1>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Fecha */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <Calendar className="w-6 h-6 text-teal-600" />
            <div>
              <p className="text-sm text-gray-500">Fecha</p>
              <p className="font-medium">{formatDate(consultation.date, "d 'de' MMMM, yyyy")}</p>
            </div>
          </div>

          {/* Doctor */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <User className="w-6 h-6 text-teal-600" />
            <div>
              <p className="text-sm text-gray-500">Atendido por</p>
              {consultation.doctor ? (
                <>
                  <p className="font-medium">Dr. {consultation.doctor.name}</p>
                  {consultation.doctor.specialty && (
                    <p className="text-xs text-gray-400">{consultation.doctor.specialty}</p>
                  )}
                </>
              ) : (
                <p className="text-gray-400">No especificado</p>
              )}
            </div>
          </div>

          {/* Costo */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <DollarSign className="w-6 h-6 text-teal-600" />
            <div>
              <p className="text-sm text-gray-500">Costo</p>
              <div className="flex items-center gap-2">
                <p className="font-medium">
                  {consultation.cost ? `$${consultation.cost.toLocaleString()}` : 'No especificado'}
                </p>
                {consultation.paymentStatus && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${paymentStatusLabels[consultation.paymentStatus]?.class}`}>
                    {paymentStatusLabels[consultation.paymentStatus]?.label}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Paciente */}
        <div>
          <h2 className="font-semibold text-gray-800 mb-2">Paciente</h2>
          {consultation.patient ? (
            <Link
              to={`/admin/patients/${consultation.patient._id}`}
              className="text-teal-600 hover:text-teal-700 font-medium"
            >
              {consultation.patient.name}
            </Link>
          ) : (
            <p className="text-gray-500">Paciente no registrado</p>
          )}
        </div>

        {/* Diagnóstico */}
        <div>
          <h2 className="font-semibold text-gray-800 mb-2">Diagnóstico</h2>
          <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
            {consultation.diagnosis || "No especificado"}
          </p>
        </div>

        {/* Tratamiento */}
        <div>
          <h2 className="font-semibold text-gray-800 mb-2">Tratamiento</h2>
          <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
            {consultation.treatment || "No especificado"}
          </p>
        </div>

        {/* Procedimientos */}
        {consultation.procedures && consultation.procedures.length > 0 && (
          <div>
            <h2 className="font-semibold text-gray-800 mb-2">Procedimientos</h2>
            <div className="space-y-2">
              {consultation.procedures.map((proc, i) => (
                <div key={i} className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{proc.name}</span>
                    {proc.tooth && (
                      <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded">
                        Diente {proc.tooth}
                      </span>
                    )}
                  </div>
                  {proc.notes && <p className="text-sm text-gray-600 mt-1">{proc.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Odontograma */}
        {consultation.odontogram && Object.keys(consultation.odontogram).length > 0 && (
          <div>
            <h2 className="font-semibold text-gray-800 mb-3">🦷 Odontograma</h2>
            <Odontogram value={consultation.odontogram} readOnly={true} />
          </div>
        )}

        {/* Notas */}
        {consultation.notes && (
          <div>
            <h2 className="font-semibold text-gray-800 mb-2">Notas</h2>
            <p className="text-gray-700 whitespace-pre-line bg-gray-50 p-3 rounded-lg">
              {consultation.notes}
            </p>
          </div>
        )}

        {/* Fotos */}
        <div>
          <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
            <Image className="w-5 h-5" /> Fotografías
          </h2>

          {!consultation.photos || consultation.photos.length === 0 ? (
            <p className="text-gray-500">No se subieron fotos.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {consultation.photos.map((photo, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedPhoto(getPhotoUrl(photo))}
                  className="block focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-xl"
                >
                  <img
                    src={getPhotoUrl(photo)}
                    alt={`Foto ${i + 1}`}
                    className="rounded-xl shadow-sm w-full h-32 object-cover border hover:opacity-90 transition-opacity"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/150?text=Sin+Imagen";
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

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

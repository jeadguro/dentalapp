import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { consultationsAPI } from "../services/api";
import { formatDate } from "../utils/dateUtils";
import { ArrowLeft, Calendar, Image } from "lucide-react";

export default function ConsultationView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [consultation, setConsultation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConsultation();
  }, []);

  const loadConsultation = async () => {
    try {
      const { data } = await consultationsAPI.getOne(id);
      setConsultation(data.data.consultation);
    } catch (error) {
      console.error(error);
      navigate("/consultations");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <p className="text-gray-500">Cargando consulta...</p>
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="page-container">
        <p className="text-red-500">Consulta no encontrada</p>
        <button onClick={() => navigate("/consultations")} className="btn-primary mt-4">
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="page-container space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/consultations")}
          className="btn-secondary flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        <Link
          to={`/consultations/${consultation._id}/edit`}
          className="btn-primary"
        >
          Editar Consulta
        </Link>
      </div>

      {/* Info Card */}
      <div className="card p-6 space-y-4">
        <h1 className="page-title">Detalles de la consulta</h1>

        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="w-5 h-5" />
          <span>{formatDate(consultation.date)}</span>
        </div>

        <div>
          <h2 className="font-semibold text-charcoal-800">Paciente</h2>
          <Link
            to={`/patients/${consultation.patient?._id}`}
            className="text-dental-600 hover:text-dental-700"
          >
            {consultation.patient?.name}
          </Link>
        </div>

        <div>
          <h2 className="font-semibold text-charcoal-800">Diagnóstico</h2>
          <p className="text-gray-700">
            {consultation.diagnosis || "No especificado"}
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-charcoal-800">Tratamiento</h2>
          <p className="text-gray-700">
            {consultation.treatment || "No especificado"}
          </p>
        </div>

        {/* Notes */}
        {consultation.notes && (
          <div>
            <h2 className="font-semibold text-charcoal-800">Notas</h2>
            <p className="text-gray-700 whitespace-pre-line">
              {consultation.notes}
            </p>
          </div>
        )}

        {/* Photos */}
        <div>
          <h2 className="font-semibold text-charcoal-800 flex items-center gap-2">
            <Image className="w-5 h-5" /> Fotografías
          </h2>

          {consultation.photos?.length === 0 && (
            <p className="text-gray-500">No se subieron fotos.</p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-3">
            {consultation.photos?.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Foto ${i + 1}`}
                className="rounded-xl shadow-sm w-full h-32 object-cover"
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

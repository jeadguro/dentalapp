// src/pages/patient/BookAppointment.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { settingsAPI, authAPI, patientAppointmentsAPI } from '../../services/api';
import { Calendar, Clock, User, ChevronLeft, ChevronRight, Check } from 'lucide-react';

const APPOINTMENT_TYPES = {
  checkup: 'Revisión general',
  cleaning: 'Limpieza dental',
  emergency: 'Urgencia',
  other: 'Otro'
};

export default function BookAppointment() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: tipo, 2: doctor, 3: fecha, 4: confirmar
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Datos del formulario
  const [appointmentType, setAppointmentType] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  
  // Datos cargados
  const [doctors, setDoctors] = useState([]);
  const [availableTypes, setAvailableTypes] = useState({});
  const [availableSlots, setAvailableSlots] = useState([]);
  const [settings, setSettings] = useState(null);

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  // Cargar slots cuando cambia fecha o doctor
  useEffect(() => {
    if (selectedDate && selectedDoctor) {
      loadAvailableSlots();
    }
  }, [selectedDate, selectedDoctor]);

  const loadInitialData = async () => {
    try {
      const [doctorsRes, typesRes, settingsRes] = await Promise.all([
        authAPI.getDoctors(),
        settingsAPI.getAppointmentTypes(),
        settingsAPI.get()
      ]);
      
      setDoctors(doctorsRes.data.data);
      setAvailableTypes(typesRes.data.data);
      setSettings(settingsRes.data.data);
    } catch (err) {
      setError('Error al cargar datos');
    }
  };

  const loadAvailableSlots = async () => {
    try {
      const { data } = await settingsAPI.getAvailableSlots(selectedDate, selectedDoctor._id);
      setAvailableSlots(data.data.slots || []);
      setSelectedTime(''); // Reset time when date changes
    } catch (err) {
      setAvailableSlots([]);
    }
  };

  const getAvailableDates = () => {
    if (!settings) return [];
    
    const dates = [];
    const today = new Date();
    const maxDays = settings.maxBookingDaysAhead || 7;
    
    for (let i = 0; i <= maxDays; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayOfWeek = date.getDay();
      const daySchedule = settings.schedule?.[dayOfWeek];
      
      // Solo agregar si el día está habilitado
      if (daySchedule?.enabled) {
        dates.push({
          date: date.toISOString().split('T')[0],
          dayName: date.toLocaleDateString('es-MX', { weekday: 'short' }),
          dayNum: date.getDate(),
          month: date.toLocaleDateString('es-MX', { month: 'short' })
        });
      }
    }
    
    return dates;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    
    try {
      const dateTime = new Date(`${selectedDate}T${selectedTime}:00`);
      
      await patientAppointmentsAPI.book({
        date: dateTime.toISOString(),
        type: appointmentType,
        doctorId: selectedDoctor._id,
        notes
      });
      
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al agendar la cita');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Cita Agendada!</h2>
          <p className="text-gray-600 mb-6">
            Tu cita ha sido registrada exitosamente. Recibirás una confirmación pronto.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-500">Detalles:</p>
            <p className="font-medium">{APPOINTMENT_TYPES[appointmentType] || appointmentType}</p>
            <p className="text-gray-600">Dr. {selectedDoctor?.name}</p>
            <p className="text-gray-600">
              {new Date(selectedDate).toLocaleDateString('es-MX', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })} a las {selectedTime}
            </p>
          </div>
          <button
            onClick={() => navigate('/portal')}
            className="w-full py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700"
          >
            Volver al Portal
          </button>
        </div>
      </div>
    );
  }

  const availableDates = getAvailableDates();

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/portal')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">Agendar Cita</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Progress */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= s ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {s}
              </div>
              {s < 4 && (
                <div className={`w-12 sm:w-20 h-1 mx-1 ${step > s ? 'bg-teal-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Tipo de cita */}
        {step === 1 && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">¿Qué tipo de cita necesitas?</h2>
            <div className="grid gap-3">
              {Object.entries(availableTypes).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => {
                    setAppointmentType(key);
                    setStep(2);
                  }}
                  className={`p-4 border-2 rounded-xl text-left transition-colors ${
                    appointmentType === key 
                      ? 'border-teal-600 bg-teal-50' 
                      : 'border-gray-200 hover:border-teal-300'
                  }`}
                >
                  <span className="font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Doctor */}
        {step === 2 && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Selecciona un doctor</h2>
            <div className="grid gap-3">
              {doctors.map((doctor) => (
                <button
                  key={doctor._id}
                  onClick={() => {
                    setSelectedDoctor(doctor);
                    setStep(3);
                  }}
                  className={`p-4 border-2 rounded-xl text-left transition-colors flex items-center gap-4 ${
                    selectedDoctor?._id === doctor._id 
                      ? 'border-teal-600 bg-teal-50' 
                      : 'border-gray-200 hover:border-teal-300'
                  }`}
                >
                  <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <p className="font-medium">Dr. {doctor.name}</p>
                    <p className="text-sm text-gray-500">{doctor.specialty || 'Odontología General'}</p>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(1)}
              className="mt-4 text-gray-500 hover:text-gray-700 text-sm"
            >
              ← Volver
            </button>
          </div>
        )}

        {/* Step 3: Fecha y hora */}
        {step === 3 && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Selecciona fecha y hora</h2>
            
            {/* Fechas */}
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-3">Fecha disponible:</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {availableDates.map((d) => (
                  <button
                    key={d.date}
                    onClick={() => setSelectedDate(d.date)}
                    className={`flex-shrink-0 p-3 rounded-xl text-center min-w-[70px] transition-colors ${
                      selectedDate === d.date 
                        ? 'bg-teal-600 text-white' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <p className="text-xs uppercase">{d.dayName}</p>
                    <p className="text-xl font-bold">{d.dayNum}</p>
                    <p className="text-xs">{d.month}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Horarios */}
            {selectedDate && (
              <div>
                <p className="text-sm text-gray-500 mb-3">Horarios disponibles:</p>
                {availableSlots.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">No hay horarios disponibles para esta fecha</p>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {availableSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          selectedTime === time 
                            ? 'bg-teal-600 text-white' 
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
              >
                Volver
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!selectedDate || !selectedTime}
                className="flex-1 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Confirmar */}
        {step === 4 && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Confirma tu cita</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-teal-600" />
                <div>
                  <p className="text-sm text-gray-500">Fecha</p>
                  <p className="font-medium">
                    {new Date(selectedDate).toLocaleDateString('es-MX', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Clock className="w-5 h-5 text-teal-600" />
                <div>
                  <p className="text-sm text-gray-500">Hora</p>
                  <p className="font-medium">{selectedTime} hrs</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-teal-600" />
                <div>
                  <p className="text-sm text-gray-500">Doctor</p>
                  <p className="font-medium">Dr. {selectedDoctor?.name}</p>
                  <p className="text-sm text-gray-500">{selectedDoctor?.specialty}</p>
                </div>
              </div>

              <div className="p-3 bg-teal-50 rounded-lg">
                <p className="text-sm text-gray-500">Tipo de cita</p>
                <p className="font-medium text-teal-700">{APPOINTMENT_TYPES[appointmentType] || appointmentType}</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas adicionales (opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                maxLength={200}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                placeholder="¿Algún detalle que debamos saber?"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
              >
                Volver
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Confirmar Cita
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

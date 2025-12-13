// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { patientsAPI, consultationsAPI, appointmentsAPI } from '../services/api';
import { formatFriendlyDate, formatTime } from '../utils/dateUtils';
import { Users, FileText, Calendar, TrendingUp, Clock, ArrowRight, UserPlus, Plus } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ patients: {}, consultations: {}, appointments: {} });
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pStats, cStats, aStats, today] = await Promise.all([
        patientsAPI.getStats(),
        consultationsAPI.getStats(),
        appointmentsAPI.getStats(),
        appointmentsAPI.getToday()
      ]);
      setStats({
        patients: pStats.data.data,
        consultations: cStats.data.data,
        appointments: aStats.data.data
      });
      setTodayAppointments(today.data.data.appointments);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Total Pacientes', value: stats.patients.total || 0, change: `+${stats.patients.newThisMonth || 0} este mes`, icon: Users, color: 'dental', href: '/patients' },
    { title: 'Consultas del Mes', value: stats.consultations.thisMonth || 0, change: `${stats.consultations.total || 0} totales`, icon: FileText, color: 'blue', href: '/consultations' },
    { title: 'Citas Hoy', value: stats.appointments.today || 0, change: `${stats.appointments.pending || 0} pendientes`, icon: Calendar, color: 'amber', href: '/appointments' },
    { title: 'Consultas Hoy', value: stats.consultations.today || 0, change: 'Realizadas hoy', icon: TrendingUp, color: 'green', href: '/consultations' }
  ];

  const colorClasses = { dental: 'bg-teal-100 text-teal-600', blue: 'bg-blue-100 text-blue-600', amber: 'bg-amber-100 text-amber-600', green: 'bg-green-100 text-green-600' };

  if (loading) {
    return <div className="page-container"><div className="animate-pulse space-y-6"><div className="h-8 bg-gray-200 rounded w-1/4"></div><div className="grid grid-cols-4 gap-6">{[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>)}</div></div></div>;
  }

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="page-title">¡Hola, {user?.name?.split(' ')[0]}!</h1>
        <p className="text-gray-500">Resumen de tu consultorio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} to={stat.href} className="stat-card hover:scale-[1.02] transition-transform">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
                  <p className="stat-value">{stat.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{stat.change}</p>
                </div>
                <div className={`p-3 rounded-xl ${colorClasses[stat.color]}`}><Icon className="w-6 h-6" /></div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link to="/admin/patients/new" className="btn-primary justify-center"><UserPlus className="w-5 h-5" />Nuevo Paciente</Link>
        <Link to="/admin/consultations/new" className="btn-secondary justify-center"><Plus className="w-5 h-5" />Nueva Consulta</Link>
        <Link to="/admin/appointments/new" className="btn-secondary justify-center"><Calendar className="w-5 h-5" />Nueva Cita</Link>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-display font-semibold text-gray-900">Citas de Hoy</h2>
          <Link to="/admin/appointments" className="btn-ghost text-sm">Ver todas<ArrowRight className="w-4 h-4" /></Link>
        </div>
        {todayAppointments.length === 0 ? (
          <div className="text-center py-8"><Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" /><p className="text-gray-500">No hay citas para hoy</p></div>
        ) : (
          <div className="space-y-3">
            {todayAppointments.slice(0, 5).map((apt) => (
              <div key={apt._id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50">
                <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center"><Clock className="w-5 h-5 text-teal-600" /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{apt.patient?.name}</p>
                  <p className="text-sm text-gray-500">{apt.type}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatTime(apt.date)}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${apt.status === 'done' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {apt.status === 'done' ? 'Completada' : 'Pendiente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

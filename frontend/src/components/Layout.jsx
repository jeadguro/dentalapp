// src/components/Layout.jsx
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Home, Users, Calendar, FileText, LogOut, Menu, X, ChevronRight, User } from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Pacientes', href: '/patients', icon: Users },
  { name: 'Consultas', href: '/consultations', icon: FileText },
  { name: 'Citas', href: '/appointments', icon: Calendar },
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-stone-50">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed top-0 left-0 z-50 h-screen w-72 bg-white border-r border-gray-100 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-100">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-dental flex items-center justify-center">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2c-3 0-5 1.6-6 4-.6 1.6-.4 3.6.4 5.6.6 1.6 1 3.6 1.6 6.4.2.8 1 1.2 1.6.8.4-.2.6-.6.8-1.2l1.2-5c.2-.6.6-1 1.2-1s1 .4 1.2 1l1.2 5c.2.6.4 1 .8 1.2.6.4 1.4 0 1.6-.8.6-2.8 1-4.8 1.6-6.4.8-2 1-4 .4-5.6-1-2.4-3-4-6-4h-1.6z"/>
                </svg>
              </div>
              <span className="font-display font-bold text-lg text-gray-900">DentalCare<span className="text-teal-600 ml-1">Pro</span></span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link key={item.name} to={item.href} onClick={() => setSidebarOpen(false)} className={active ? 'sidebar-link-active' : 'sidebar-link'}>
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                  {active && <ChevronRight className="w-4 h-4 ml-auto" />}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-50">
              <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                <User className="w-5 h-5 text-teal-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{user?.name || 'Usuario'}</p>
                <p className="text-xs text-gray-500">{user?.role === 'admin' ? 'Administrador' : 'Doctor'}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors">
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* CAMBIO PRINCIPAL: lg:ml-72 en lugar de lg:pl-72, sin header en desktop */}
      <div className="lg:ml-72 min-h-screen">
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-100">
          <div className="flex items-center justify-between h-14 px-4">
            <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100">
              <Menu className="w-6 h-6" />
            </button>
            <span className="text-sm text-gray-500">
              {new Date().toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
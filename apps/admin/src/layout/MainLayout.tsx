import { NavLink } from 'react-router-dom';
import { useAuth } from '@/features/auth/auth-context';
import {
  AlertTriangle,
  Building2,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  School,
  Users,
} from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

const ENLACES = [
  { ruta: '/dashboard', etiqueta: 'Portal Educativo Regional', icono: LayoutDashboard },
  { ruta: '/convocatorias', etiqueta: 'Convocatorias', icono: Megaphone },
  { ruta: '/plazas', etiqueta: 'Plazas', icono: Users },
  { ruta: '/vacantes', etiqueta: 'Vacantes', icono: School },
  { ruta: '/infraestructura', etiqueta: 'Infraestructura y aulas', icono: Building2 },
  { ruta: '/alertas', etiqueta: 'Alertas', icono: AlertTriangle },
];

function claseEnlace(activo: boolean): string {
  const base = 'flex items-center gap-3 px-3 py-2.5 rounded-lg transition font-medium';
  return activo
    ? `${base} bg-white/20 text-white`
    : `${base} text-white/85 hover:bg-white/10 hover:text-white`;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { usuario, cerrarSesion } = useAuth();

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[#9f462d] text-white border-r border-[#8c3d27] shrink-0">
        <div className="p-6 border-b border-white/20">
          <h1 className="text-lg font-bold tracking-tight text-white">Educa <span className="text-white/85">Lambayeque</span></h1>
          <p className="text-xs text-white/75 mt-1">GRE Lambayeque - Panel Administrativo</p>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1">
          {ENLACES.map(({ ruta, etiqueta, icono: Icono }) => (
            <NavLink key={ruta} to={ruta} className={({ isActive }) => claseEnlace(isActive)}>
              <Icono className="w-5 h-5" /> {etiqueta}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-white/20">
          <button
            onClick={cerrarSesion}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/90 hover:bg-white/10 hover:text-white transition font-medium"
          >
            <LogOut className="w-5 h-5" /> Cerrar sesi&oacute;n
          </button>
          {usuario && (
            <p className="text-xs text-white/75 mt-2">{usuario.nombre} <span className="font-semibold text-white">({usuario.rol})</span></p>
          )}
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-[#8c3d27] bg-[#9f462d] text-white flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 rounded text-white hover:bg-white/10">
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold">{typeof children === 'string' ? children : ''}</h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-white/85 hidden sm:block">GRE Lambayeque</span>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold text-xs border border-white/40">
              {usuario?.nombre?.charAt(0) ?? '?'}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

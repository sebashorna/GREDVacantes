import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/features/auth/auth-context';
import {
  AlertTriangle,
  Building2,
  Home,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  School,
  Users,
  X,
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

// Inicio queda en el centro; Alertas se accede desde el icono del encabezado.
const ENLACES_BARRA = ['/convocatorias', '/plazas', '/dashboard', '/vacantes', '/infraestructura']
  .map((ruta) => ENLACES.find((enlace) => enlace.ruta === ruta))
  .filter((enlace): enlace is (typeof ENLACES)[number] => enlace !== undefined);

function claseEnlace(activo: boolean): string {
  const base = 'flex items-center gap-3 px-3 py-2.5 rounded-lg transition font-medium';
  return activo
    ? `${base} bg-white/20 text-white`
    : `${base} text-white/85 hover:bg-white/10 hover:text-white`;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { usuario, cerrarSesion } = useAuth();
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const soloConsulta = import.meta.env.VITE_APP_MOBILE === 'true' || window.location.pathname === '/app/consulta';
  const nombreVista = soloConsulta ? 'Consulta ciudadana · Solo lectura' : 'Panel Administrativo';
  const etiquetaMovil: Record<string, string> = {
    '/dashboard': 'Inicio',
    '/convocatorias': 'Convoc.',
    '/plazas': 'Plazas',
    '/vacantes': 'Vacantes',
    '/infraestructura': 'Infraest.',
    '/alertas': 'Alertas',
  };

  return (
    <div className="flex h-dvh bg-background text-on-surface">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[#9f462d] text-white border-r border-[#8c3d27] shrink-0">
        <div className="p-6 border-b border-white/20">
          <h1 className="text-lg font-bold tracking-tight text-white">Educa <span className="text-white/85">Lambayeque</span></h1>
          <p className="text-xs text-white/75 mt-1">GRE Lambayeque - {nombreVista}</p>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1">
          {ENLACES.map(({ ruta, etiqueta, icono: Icono }) => (
            <NavLink key={ruta} to={ruta} className={({ isActive }) => claseEnlace(isActive)}>
              <Icono className="w-5 h-5" /> {etiqueta}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-white/20">
          {!soloConsulta && (
            <button
              onClick={cerrarSesion}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/90 hover:bg-white/10 hover:text-white transition font-medium"
            >
              <LogOut className="w-5 h-5" /> Cerrar sesi&oacute;n
            </button>
          )}
          {usuario && (
            <p className="text-xs text-white/75 mt-2">
              {usuario.nombre}
              {!soloConsulta && <span className="font-semibold text-white"> ({usuario.rol})</span>}
            </p>
          )}
        </div>
      </aside>

      {!soloConsulta && menuMovilAbierto && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMenuMovilAbierto(false)}
          role="presentation"
        >
          <aside
            className="flex h-full w-72 max-w-[85vw] flex-col bg-[#9f462d] text-white shadow-xl"
            onClick={(evento) => evento.stopPropagation()}
            aria-label="Menú de navegación"
          >
            <div className="flex items-start justify-between border-b border-white/20 p-5">
              <div>
                <h1 className="text-lg font-bold tracking-tight">Educa Lambayeque</h1>
                <p className="mt-1 text-xs text-white/75">{nombreVista}</p>
              </div>
              <button
                type="button"
                onClick={() => setMenuMovilAbierto(false)}
                aria-label="Cerrar menú"
                className="rounded p-2 text-white hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav id="menu-navegacion-movil" className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
              {ENLACES.map(({ ruta, etiqueta, icono: Icono }) => (
                <NavLink
                  key={ruta}
                  to={ruta}
                  onClick={() => setMenuMovilAbierto(false)}
                  className={({ isActive }) => claseEnlace(isActive)}
                >
                  <Icono className="h-5 w-5" /> {etiqueta}
                </NavLink>
              ))}
            </nav>
            <div className="border-t border-white/20 p-4">
              {!soloConsulta && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuMovilAbierto(false);
                    void cerrarSesion();
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-white/90 transition hover:bg-white/10 hover:text-white"
                >
                  <LogOut className="h-5 w-5" /> Cerrar sesión
                </button>
              )}
              {usuario && (
                <p className="mt-2 text-xs text-white/75">
                  {usuario.nombre}
                  {!soloConsulta && <span className="font-semibold text-white"> ({usuario.rol})</span>}
                </p>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Contenido principal */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="h-14 shrink-0 border-b border-[#8c3d27] bg-[#9f462d] text-white flex items-center justify-between px-3 sm:h-16 sm:px-6">
          <div className="flex items-center gap-3">
            {!soloConsulta && (
              <button
                type="button"
                onClick={() => setMenuMovilAbierto(true)}
                aria-label="Abrir menú"
                aria-expanded={menuMovilAbierto}
                aria-controls="menu-navegacion-movil"
                className="md:hidden rounded p-2 text-white hover:bg-white/10"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
            {soloConsulta && (
              <>
                <img src="/Imagenes/GORE.png" alt="" className="h-8 w-8 rounded-full bg-white object-contain p-0.5" />
                <span className="text-sm font-bold sm:text-base">Educa Lambayeque</span>
              </>
            )}
            <h2 className="text-lg font-semibold">{typeof children === 'string' ? children : ''}</h2>
          </div>
          <div className="flex items-center gap-4">
            {import.meta.env.VITE_APP_DEMO === 'true' && (
              <span className="rounded-full bg-amber-300/20 px-2.5 py-1 text-xs font-semibold text-amber-100">
                DEMOSTRACIÓN · DATOS FICTICIOS
              </span>
            )}
            <span className="text-sm text-white/85 hidden sm:block">GRE Lambayeque</span>
            {soloConsulta && (
              <NavLink
                to="/alertas"
                aria-label="Alertas"
                className="rounded-full p-2 text-white hover:bg-white/10 md:hidden"
              >
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </NavLink>
            )}
            {!soloConsulta && (
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold text-xs border border-white/40">
                {usuario?.nombre?.charAt(0) ?? '?'}
              </div>
            )}
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
        {soloConsulta && (
          <nav
            aria-label="Navegación principal"
            className="z-30 grid shrink-0 grid-cols-5 border-t border-[#8c3d27] bg-[#9f462d] pb-[env(safe-area-inset-bottom)] text-white shadow-[0_-4px_16px_rgba(74,31,20,0.18)] md:hidden"
          >
            {ENLACES_BARRA.map(({ ruta, icono: Icono }) => {
              const central = ruta === '/dashboard';
              return (
                <NavLink
                  key={ruta}
                  to={ruta}
                  aria-label={etiquetaMovil[ruta]}
                  className={({ isActive }) =>
                    `flex min-w-0 flex-col items-center justify-center gap-1 px-0.5 py-2 text-[10px] font-medium leading-tight transition ${
                      isActive ? 'bg-white/15 text-white' : 'text-white/75 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  {central ? (
                    <span className="-mt-5 flex h-11 w-11 items-center justify-center rounded-full border-4 border-background bg-[#7a2f1c] shadow-md">
                      <Home className="h-6 w-6 shrink-0" aria-hidden="true" />
                    </span>
                  ) : (
                    <Icono className="h-5 w-5 shrink-0" aria-hidden="true" />
                  )}
                  <span className="truncate">{etiquetaMovil[ruta]}</span>
                </NavLink>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
}

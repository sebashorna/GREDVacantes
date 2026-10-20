import { useAuth } from '@/features/auth/auth-context';
import { LogOut, Menu, ShieldAlert, Users } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { usuario, cerrarSesion } = useAuth();

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 shrink-0">
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-lg font-bold tracking-tight text-indigo-700">Educa <span className="text-slate-600">Lambayeque</span></h1>
          <p className="text-xs text-slate-500 mt-1">GRE Lambayeque - Panel Administrativo</p>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1">
          <a
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-indigo-50 text-indigo-700 font-medium"
          >
            <Users className="w-5 h-5" /> Dashboard
          </a>
          <a
            href="/convocatorias"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition"
          >
            <ShieldAlert className="w-5 h-5" /> Convocatorias
          </a>
          <a
            href="/plazas"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition"
          >
            <ShieldAlert className="w-5 h-5" /> Plazas
          </a>
          <a
            href="/vacantes"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition"
          >
            <ShieldAlert className="w-5 h-5" /> Vacantes
          </a>
          <a
            href="/alertas"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition"
          >
            <ShieldAlert className="w-5 h-5" /> Alertas
          </a>
        </nav>
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={cerrarSesion}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-800 transition font-medium"
          >
            <LogOut className="w-5 h-5" /> Cerrar sesi&oacute;n
          </button>
          {usuario && (
            <p className="text-xs text-slate-500 mt-2">{usuario.nombre} <span className="font-semibold text-slate-700">({usuario.rol})</span></p>
          )}
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 rounded hover:bg-slate-100">
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold">{typeof children === 'string' ? children : ''}</h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 hidden sm:block">GRE Lambayeque</span>
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-xs">
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
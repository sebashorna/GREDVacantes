import { ArrowLeft, ArrowRight, Check, Download, Smartphone } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export function DescargaAppPage() {
  const [descargaSimulada, setDescargaSimulada] = useState(false);

  return (
    <main className="flex min-h-screen flex-col bg-background text-on-surface">
      <header className="border-b border-outline-variant bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <a href="/" className="flex min-w-0 items-center gap-3 text-primary">
            <img
              src="/Imagenes/GORE.png"
              alt="Logotipo del Gobierno Regional de Lambayeque"
              className="h-11 w-11 shrink-0 object-contain"
            />
            <span className="min-w-0 text-sm font-bold leading-tight sm:text-base">
              Educa Lambayeque
              <span className="block text-xs font-medium text-on-surface-variant">Descarga de la aplicación</span>
            </span>
          </a>
          <Link to="/" className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant px-3 py-2 text-sm font-semibold text-primary hover:bg-surface-container-low">
            <ArrowLeft size={16} /> <span className="hidden sm:inline">Volver al portal</span><span className="sm:hidden">Volver</span>
          </Link>
        </div>
      </header>

      <section
        className="flex flex-1 items-center bg-[#813019] bg-cover bg-center px-4 py-12 text-white sm:px-6"
        style={{
          backgroundImage:
            'linear-gradient(90deg, rgba(75, 24, 15, 0.94), rgba(74, 26, 16, 0.84)), url("/Imagenes/GoreUbigeo.jpg")',
        }}
      >
        <div className="mx-auto w-full max-w-lg rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-sm sm:p-9">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-white p-3 shadow">
            <img src="/Imagenes/GORE.png" alt="Logotipo del Gobierno Regional de Lambayeque" className="h-full w-full object-contain" />
          </div>
          <p className="mt-6 text-center text-xs font-bold uppercase tracking-[0.15em] text-white/75">Aplicación ciudadana</p>
          <h1 className="mt-2 text-center text-2xl font-bold sm:text-3xl">Educa Lambayeque</h1>
          <p className="mt-3 text-center text-sm leading-relaxed text-white/85">
            Vacantes, plazas docentes, convocatorias y comunicados educativos en un solo lugar.
          </p>

          {!descargaSimulada ? (
            <button
              type="button"
              onClick={() => setDescargaSimulada(true)}
              className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-primary hover:bg-[#fff1ec]"
            >
              <Download size={19} /> Descargar aplicación
            </button>
          ) : (
            <div className="mt-7 rounded-2xl bg-white p-4 text-on-surface" aria-live="polite">
              <p className="flex items-center gap-2 font-semibold text-primary">
                <Check size={19} /> Descarga simulada completada
              </p>
              <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
                En esta presentación no se instala un APK real. Puedes abrir la app e iniciar sesión.
              </p>
              <Link
                to="/app"
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-container"
              >
                <Smartphone size={18} /> Abrir aplicación <ArrowRight size={17} />
              </Link>
            </div>
          )}

          <p className="mt-5 text-center text-xs text-white/65">
            Demostración para presentación · No se descarga ningún archivo APK
          </p>
        </div>
      </section>
    </main>
  );
}

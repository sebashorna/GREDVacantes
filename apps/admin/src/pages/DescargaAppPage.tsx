import { ArrowLeft, Download, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';

export function DescargaAppPage() {
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
          <p className="mt-6 text-center text-xs font-bold uppercase tracking-[0.15em] text-white/75">APK de demostración</p>
          <h1 className="mt-2 text-center text-2xl font-bold sm:text-3xl">Educa Lambayeque</h1>
          <p className="mt-3 text-center text-sm leading-relaxed text-white/85">
            Descarga e instala la aplicación de prueba para comprobar su funcionamiento en un teléfono Android.
          </p>

          <a
            href="/downloads/educa-lambayeque-demo.apk"
            download
            className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-primary hover:bg-[#fff1ec]"
          >
            <Download size={19} /> Descargar APK para Android
          </a>

          <div className="mt-5 rounded-2xl bg-white p-4 text-sm leading-relaxed text-on-surface">
            <p className="flex items-center gap-2 font-semibold text-primary">
              <Smartphone size={18} /> Instalación en Android
            </p>
            <ol className="mt-2 list-inside list-decimal space-y-1 text-xs text-on-surface-variant">
              <li>Descarga el archivo y ábrelo desde las notificaciones o la carpeta Descargas.</li>
              <li>Si Android lo solicita, permite instalar aplicaciones desde esta fuente y confirma la instalación.</li>
              <li>Abre Educa Lambayeque e inicia sesión en el panel de demostración.</li>
            </ol>
          </div>
          <p className="mt-4 text-center text-xs text-white/75">
            Versión de demostración: muestra el panel administrativo y usa datos ficticios locales. No requiere depuración ni conexión a la nube.
          </p>
        </div>
      </section>
    </main>
  );
}

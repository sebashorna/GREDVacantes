import { Link } from 'react-router-dom';

export function SimulacionAppPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center bg-[#eee9e7] px-4 py-3 max-sm:bg-background max-sm:p-0">
      <header className="mb-3 flex w-full max-w-lg items-center justify-between max-sm:hidden">
        <div>
          <p className="text-sm font-bold text-primary">Educa Lambayeque</p>
          <h1 className="mt-1 text-lg font-semibold text-on-surface">Aplicación móvil</h1>
        </div>
        <Link to="/" className="text-sm font-semibold text-primary hover:underline">
          Volver a la web
        </Link>
      </header>
      <div className="h-[min(900px,calc(100dvh-72px))] w-[min(480px,calc(100vw-32px))] overflow-hidden rounded-[2.6rem] border-[8px] border-[#211e1d] bg-white shadow-2xl max-sm:h-dvh max-sm:w-screen max-sm:rounded-none max-sm:border-0 max-sm:shadow-none">
        <iframe
          title="Aplicación ciudadana Educa Lambayeque"
          src="/app/consulta"
          className="h-full w-full border-0"
        />
      </div>
      <p className="mt-2 max-w-lg text-center text-xs text-on-surface-variant max-sm:hidden">
        Simulación de presentación: la app real se distribuirá como APK cuando esté publicada.
      </p>
    </main>
  );
}

import { useEffect, useState } from 'react';
import { Navigate, useLocation, Routes, Route } from 'react-router-dom';
import { useAuth } from '@/features/auth/auth-context';
import { MainLayout } from '@/layout/MainLayout';
import { LoginPage } from '@/features/auth/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ConvocatoriasPage } from '@/pages/ConvocatoriasPage';
import { PlazasPage } from '@/pages/PlazasPage';
import { VacantesPage } from '@/pages/VacantesPage';
import { AlertasPage } from '@/pages/AlertasPage';
import { InfraestructuraPage } from '@/pages/InfraestructuraPage';
import { PortalCiudadanoPage } from '@/pages/PortalCiudadanoPage';
import { DescargaAppPage } from '@/pages/DescargaAppPage';
import { SimulacionAppPage } from '@/pages/SimulacionAppPage';

export default function App() {
  const { cargando, estaAutenticado } = useAuth();
  const location = useLocation();
  const [verificado, setVerificado] = useState(false);
  const esAplicacionMovil = import.meta.env.VITE_APP_MOBILE === 'true';

  useEffect(() => {
    if (!cargando) setVerificado(true);
  }, [cargando]);

  if (esAplicacionMovil) {
    return (
      <MainLayout>
        <Routes>
          <Route path="*" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/convocatorias" element={<ConvocatoriasPage />} />
          <Route path="/plazas" element={<PlazasPage />} />
          <Route path="/vacantes" element={<VacantesPage />} />
          <Route path="/alertas" element={<AlertasPage />} />
          <Route path="/infraestructura" element={<InfraestructuraPage />} />
        </Routes>
      </MainLayout>
    );
  }

  if (!verificado) {
    return <div className="flex items-center justify-center h-screen text-on-surface-variant">Cargando...</div>;
  }

  if (location.pathname === '/') {
    return <PortalCiudadanoPage />;
  }

  if (location.pathname === '/descargar') {
    return <DescargaAppPage />;
  }

  if (location.pathname === '/app') {
    return <SimulacionAppPage />;
  }

  if (location.pathname === '/portal') {
    return <PortalCiudadanoPage />;
  }

  if (location.pathname === '/app/consulta') {
    return (
      <MainLayout>
        <Routes>
          <Route path="*" element={<DashboardPage />} />
          <Route path="/app/consulta" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/convocatorias" element={<ConvocatoriasPage />} />
          <Route path="/plazas" element={<PlazasPage />} />
          <Route path="/vacantes" element={<VacantesPage />} />
          <Route path="/alertas" element={<AlertasPage />} />
          <Route path="/infraestructura" element={<InfraestructuraPage />} />
        </Routes>
      </MainLayout>
    );
  }

  if (location.pathname === '/login' && new URLSearchParams(location.search).get('modo') === 'app') {
    return <LoginPage modoAplicacion />;
  }

  const rutasPublicas = ['/login'];

  if (!estaAutenticado) {
    if (rutasPublicas.includes(location.pathname)) {
      return <LoginPage />;
    }
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (location.pathname === '/login') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/convocatorias" element={<ConvocatoriasPage />} />
        <Route path="/plazas" element={<PlazasPage />} />
        <Route path="/vacantes" element={<VacantesPage />} />
        <Route path="/alertas" element={<AlertasPage />} />
        <Route path="/infraestructura" element={<InfraestructuraPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </MainLayout>
  );
}
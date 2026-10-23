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

export default function App() {
  const { cargando, estaAutenticado } = useAuth();
  const location = useLocation();
  const [verificado, setVerificado] = useState(false);

  useEffect(() => {
    if (!cargando) setVerificado(true);
  }, [cargando]);

  if (!verificado) {
    return <div className="flex items-center justify-center h-screen text-slate-500">Cargando...</div>;
  }

  const rutasPublicas = ['/login'];

  if (!estaAutenticado) {
    if (rutasPublicas.includes(location.pathname)) {
      return <LoginPage />;
    }
    if (location.pathname === '/') {
      return <PortalCiudadanoPage />;
    }
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (location.pathname === '/') {
    return <PortalCiudadanoPage />;
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
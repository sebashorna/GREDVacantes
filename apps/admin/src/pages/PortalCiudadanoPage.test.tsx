// @vitest-environment jsdom
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api', () => ({
  api: {
    get: async (url: string) => {
      const ie = { nombre: 'Institución de prueba', fotoUrl: '/uploads/foto.png', distrito: 'Distrito', provincia: 'Provincia', ugel: 'UGEL', telefono: null, whatsapp: null };
      if (url === '/public/vacantes') return { data: { totalCuposDisponibles: 2 } };
      if (url === '/public/vacantes/listado') return { data: [{ id: 1, nivel: 'PRIMARIA', turno: 'MANANA', cupoDisponibles: 2, fechaLimite: null, ie }] };
      if (url.startsWith('/public/plazas')) return { data: [{ id: 1, cargo: 'Docente', area: 'Educación', nivel: 'PRIMARIA', jornada: 'JORNADA_30', zona: 'URBANA', turno: 'MANANA', tipo: 'ORGANICA', cantidad: 1, ie, convocatoria: { titulo: 'Convocatoria de prueba', numeroRD: '123', fechaInicio: '2026-01-01', fechaFin: '2027-01-01', pdfMeritosUrl: null } }] };
      return { data: [] };
    },
  },
}));

import { PortalCiudadanoPage } from './PortalCiudadanoPage';

describe('fotos de instituciones en el landing', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('muestra la foto recibida para vacantes y plazas', async () => {
    vi.stubEnv('VITE_APP_DEMO', 'false');
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })));
    const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={cliente}><MemoryRouter><PortalCiudadanoPage /></MemoryRouter></QueryClientProvider>);
    await waitFor(() => expect(screen.getAllByRole('img', { name: 'Institución educativa Institución de prueba' })).toHaveLength(2));
    const fotos = screen.getAllByRole('img', { name: 'Institución educativa Institución de prueba' });
    for (const foto of fotos) expect(foto.getAttribute('src')).toBe('/uploads/foto.png');
  });
});

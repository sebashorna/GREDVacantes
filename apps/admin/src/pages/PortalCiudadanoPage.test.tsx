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
      if (url.startsWith('/public/comunicados')) return { data: [{ id: '1', titulo: 'Comunicado de prueba', resumen: 'Resumen de prueba', categoria: 'SERVICIO', fecha: '2026-01-01', imagenUrl: 'http://localhost:3000/uploads/b008bced-c16d-4485-9687-9848285d4457.png', documentoUrl: null }] };
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

  it('evita la respuesta en caché anterior para imágenes subidas de comunicados', async () => {
    vi.stubEnv('VITE_APP_DEMO', 'false');
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })));
    const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={cliente}><MemoryRouter><PortalCiudadanoPage /></MemoryRouter></QueryClientProvider>);
    const foto = await screen.findByRole('img', { name: 'Imagen del comunicado: Comunicado de prueba' });
    expect(foto.getAttribute('src')).toBe('http://localhost:3000/uploads/b008bced-c16d-4485-9687-9848285d4457.png?v=3');
  });
});

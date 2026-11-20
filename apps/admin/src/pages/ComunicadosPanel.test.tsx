// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor, cleanup, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { comunicadoCreateSchema } from '@shared';

vi.mock('@/features/auth/auth-context', () => ({
  useAuth: () => ({ usuario: { rol: 'ADMIN_GRED' }, puede: (...roles: string[]) => roles.includes('ADMIN_GRED') }),
  mensajeDeError: (error: Error) => error.message,
}));
vi.mock('@/lib/api', async () => {
  const { default: axios } = await import('axios');
  const { demoApiAdapter } = await import('../lib/demo-api');
  return { api: axios.create({ baseURL: '/api', adapter: demoApiAdapter }) };
});

import { ComunicadosPanel } from './ComunicadosPanel';

describe('adjuntos de comunicados', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubEnv('VITE_APP_DEMO', 'true');
    vi.stubEnv('VITE_APP_MOBILE', 'false');
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  it('guarda y vuelve a mostrar una imagen y un PDF de demostración', async () => {
    const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { container } = render(<QueryClientProvider client={cliente}><ComunicadosPanel /></QueryClientProvider>);
    fireEvent.click(await screen.findByRole('button', { name: 'Nuevo comunicado' }));
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Aviso con adjuntos' } });
    fireEvent.change(screen.getByLabelText('Resumen'), { target: { value: 'Resumen del aviso de prueba' } });
    fireEvent.change(screen.getByLabelText('Fecha de publicación'), { target: { value: '2026-11-20' } });
    const archivos = container.ownerDocument.querySelectorAll<HTMLInputElement>('input[type=file]');
    expect(archivos).toHaveLength(2);
    fireEvent.change(archivos[0]!, { target: { files: [new File(['imagen'], 'imagen.png', { type: 'image/png' })] } });
    fireEvent.change(archivos[1]!, { target: { files: [new File(['%PDF-1.4'], 'aviso.pdf', { type: 'application/pdf' })] } });
    await screen.findByText('Imagen adjunta 1');
    await screen.findByText('PDF adjunto 1');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    const titulo = await screen.findByRole('heading', { name: 'Aviso con adjuntos' });
    const tarjeta = titulo.closest('article');
    expect(tarjeta).not.toBeNull();
    expect(within(tarjeta!).getByRole('button', { name: /Ver Imagen:/ })).toBeTruthy();
    expect(within(tarjeta!).getByRole('button', { name: /Ver Documento:/ })).toBeTruthy();
    fireEvent.click(within(tarjeta!).getByRole('button', { name: 'Editar' }));
    expect(await screen.findByText('Imagen adjunta 1')).toBeTruthy();
    expect(screen.getByText('PDF adjunto 1')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Quitar PDF adjunto 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(within(tarjeta!).queryByRole('button', { name: /Ver Documento:/ })).toBeNull());
  });

  it('valida los enlaces y rechaza datos incrustados en la API', () => {
    const base = { titulo: 'Aviso de prueba', resumen: 'Resumen del aviso', categoria: 'SERVICIO', fecha: '2026-11-20', publicado: true };
    expect(comunicadoCreateSchema.safeParse({ ...base, imagenUrl: '/uploads/imagen.png', documentoUrl: 'https://ejemplo.pe/aviso.pdf' }).success).toBe(true);
    expect(comunicadoCreateSchema.safeParse({ ...base, documentoUrl: 'javascript:alert(1)' }).success).toBe(false);
    expect(comunicadoCreateSchema.safeParse({ ...base, imagenUrl: 'data:image/png;base64,AAAA' }).success).toBe(false);
  });
});

// @vitest-environment jsdom
import { fireEvent, render, screen, within, cleanup, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { institucionCreateSchema } from '@shared';

let rol = 'ADMIN_GRED';
vi.mock('@/features/auth/auth-context', () => ({
  useAuth: () => ({ puede: (...roles: string[]) => roles.includes(rol) }),
  mensajeDeError: (error: Error) => error.message,
}));
vi.mock('@/lib/api', async () => {
  const { default: axios } = await import('axios');
  const { demoApiAdapter } = await import('../lib/demo-api');
  return { api: axios.create({ baseURL: '/api', adapter: demoApiAdapter }) };
});

import { InstitucionesPage } from './InstitucionesPage';

describe('gestión de instituciones', () => {
  beforeEach(() => {
    localStorage.clear();
    rol = 'ADMIN_GRED';
    vi.stubEnv('VITE_APP_DEMO', 'true');
    vi.stubEnv('VITE_APP_MOBILE', 'false');
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  it('crea una institución con foto, permite quitarla y desactivar y reactivar', async () => {
    const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { container } = render(<QueryClientProvider client={cliente}><InstitucionesPage /></QueryClientProvider>);
    fireEvent.click(await screen.findByRole('button', { name: 'Nueva institución' }));
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Institución de prueba' } });
    fireEvent.change(screen.getByLabelText('Código modular'), { target: { value: '9999999' } });
    fireEvent.change(screen.getByLabelText('UGEL'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('Provincia'), { target: { value: '3' } });
    await waitFor(() => expect(within(screen.getByLabelText('Distrito')).getByRole('option', { name: 'Ferreñafe' })).toBeTruthy());
    expect(within(screen.getByLabelText('Distrito')).queryByRole('option', { name: 'Chiclayo' })).toBeNull();
    fireEvent.change(screen.getByLabelText('Distrito'), { target: { value: '3' } });
    const archivo = container.ownerDocument.querySelector<HTMLInputElement>('input[type=file]');
    expect(archivo).not.toBeNull();
    fireEvent.change(archivo!, { target: { files: [new File(['imagen'], 'foto.png', { type: 'image/png' })] } });
    await screen.findByText('Imagen adjunta 1');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    const titulo = await screen.findByRole('heading', { name: 'Institución de prueba' });
    const tarjeta = titulo.closest('article')!;
    expect(within(tarjeta).getByRole('img').getAttribute('src')).toMatch(/^data:image\/png;base64,/);
    expect(within(tarjeta).getByText(/Ferreñafe/)).toBeTruthy();

    fireEvent.click(within(tarjeta).getByRole('button', { name: 'Editar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Quitar imagen adjunto 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(within(tarjeta).queryByRole('img')).toBeNull());
    fireEvent.click(within(tarjeta).getByRole('button', { name: 'Desactivar' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Desactivar' }));
    await waitFor(() => expect(within(tarjeta).getByText('Inactiva')).toBeTruthy());
    fireEvent.click(within(tarjeta).getByRole('button', { name: 'Editar' }));
    fireEvent.click(screen.getByLabelText('Institución activa'));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(within(tarjeta).getByText('Activa')).toBeTruthy());
  });

  it('no ofrece acciones de escritura al consultor', async () => {
    rol = 'CONSULTOR';
    const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={cliente}><InstitucionesPage /></QueryClientProvider>);
    await screen.findByText('I.E. Demostrativa Santa Victoria');
    expect(screen.queryByRole('button', { name: 'Nueva institución' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Editar' })).toBeNull();
  });

  it('permite al editor crear, pero no editar ni desactivar', async () => {
    rol = 'EDITOR_UGEL';
    const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={cliente}><InstitucionesPage /></QueryClientProvider>);
    await screen.findByText('I.E. Demostrativa Santa Victoria');
    expect(screen.getByRole('button', { name: 'Nueva institución' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Editar' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Desactivar' })).toBeNull();
  });

  it('valida fotos públicas y rechaza enlaces inseguros en la API', () => {
    const base = { codigoModular: '1234567', nombre: 'Institución prueba', nivel: 'PRIMARIA', turno: 'MANANA', zona: 'URBANA', ugelId: 1, provinciaId: 1, distritoId: 1 };
    expect(institucionCreateSchema.safeParse({ ...base, fotoUrl: '/uploads/foto.png' }).success).toBe(true);
    expect(institucionCreateSchema.safeParse({ ...base, fotoUrl: 'javascript:alert(1)' }).success).toBe(false);
    expect(institucionCreateSchema.safeParse({ ...base, fotoUrl: 'data:image/png;base64,AAAA' }).success).toBe(false);
  });
});

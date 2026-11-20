// @vitest-environment jsdom
import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { demoApiAdapter } from './demo-api';

const cliente = axios.create({ baseURL: '/api', adapter: demoApiAdapter });

describe('comunicados en demostración', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubEnv('VITE_APP_MOBILE', 'false');
  });

  it('crea, publica, edita y elimina comunicados con identificadores de texto', async () => {
    const creado = await cliente.post('/comunicados', {
      titulo: 'Aviso de prueba', resumen: 'Resumen de prueba', categoria: 'SERVICIO',
      fecha: '2026-11-20T00:00:00.000Z', publicado: false,
    });
    const id = creado.data.id as string;
    expect(typeof id).toBe('string');
    let publicados = await cliente.get('/comunicados?publicado=true');
    expect(publicados.data.data.some((item: { id: string }) => item.id === id)).toBe(false);

    await cliente.put(`/comunicados/${id}`, { titulo: 'Aviso actualizado', publicado: true });
    publicados = await cliente.get('/comunicados?publicado=true');
    expect(publicados.data.data).toEqual(expect.arrayContaining([
      expect.objectContaining({ id, titulo: 'Aviso actualizado', publicado: true }),
    ]));
    await cliente.delete(`/comunicados/${id}`);
    const listado = await cliente.get('/comunicados');
    expect(listado.data.data.some((item: { id: string }) => item.id === id)).toBe(false);
    await expect(cliente.delete(`/comunicados/${id}`)).rejects.toThrow('no encontrado');
  });

  it('mantiene la aplicación móvil en modo de solo lectura', async () => {
    vi.stubEnv('VITE_APP_MOBILE', 'true');
    await expect(cliente.post('/comunicados', { titulo: 'Prueba' })).rejects.toThrow('solo permite consultar');
  });

  it('conserva relaciones al editar y desactivar una institución', async () => {
    await cliente.put('/instituciones/1', { nombre: 'Institución modificada', fotoUrl: '/foto.png' });
    const vacantes = await cliente.get('/vacantes');
    expect(vacantes.data.data).toEqual(expect.arrayContaining([
      expect.objectContaining({ ieId: 1, ie: expect.objectContaining({ nombre: 'Institución modificada', fotoUrl: '/foto.png' }) }),
    ]));
    await cliente.delete('/instituciones/1');
    const instituciones = await cliente.get('/instituciones');
    expect(instituciones.data.data).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 1, activo: false }),
    ]));
    const restantes = await cliente.get('/vacantes');
    expect(restantes.data.data.some((item: { ieId: number }) => item.ieId === 1)).toBe(true);
  });
});

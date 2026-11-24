import { mkdtemp, rmdir, unlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Express } from 'express';

let app: Express;
let directorio: string;

beforeAll(async () => {
  directorio = await mkdtemp(path.join(os.tmpdir(), 'educa-uploads-test-'));
  await writeFile(path.join(directorio, 'imagen.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  await writeFile(path.join(directorio, 'documento.pdf'), '%PDF-1.4\n%%EOF');
  vi.stubEnv('DIRECTORIO_ARCHIVOS', directorio);
  const { crearApp } = await import('./app.js');
  app = crearApp();
});

afterAll(async () => {
  await unlink(path.join(directorio, 'imagen.png'));
  await unlink(path.join(directorio, 'documento.pdf'));
  await rmdir(directorio);
  vi.unstubAllEnvs();
});

describe('archivos públicos', () => {
  it('permite mostrar imágenes desde el portal de otro origen', async () => {
    const respuesta = await request(app).get('/uploads/imagen.png');
    expect(respuesta.status).toBe(200);
    expect(respuesta.headers['content-type']).toMatch(/^image\/png/);
    expect(respuesta.headers['cross-origin-resource-policy']).toBe('cross-origin');
  });

  it('permite mostrar PDF en el visor sin quitar la protección del resto de la API', async () => {
    const pdf = await request(app).get('/uploads/documento.pdf');
    expect(pdf.status).toBe(200);
    expect(pdf.headers['content-type']).toMatch(/^application\/pdf/);
    expect(pdf.headers['cross-origin-resource-policy']).toBe('cross-origin');
    expect(pdf.headers['x-frame-options']).toBeUndefined();

    const api = await request(app).get('/openapi.json');
    expect(api.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(api.headers['cross-origin-resource-policy']).toBe('same-origin');
    expect(Object.keys(api.body.paths)).toContain('/api/vacantes');
  });

  it.each(['imagen.png', 'documento.pdf'])('revalida %s y conserva las cabeceras en respuestas 304', async (archivo) => {
    const primera = await request(app).get(`/uploads/${archivo}`);
    expect(primera.status).toBe(200);
    expect(primera.headers['cache-control']).toBe('public, no-cache');
    const etag = primera.headers.etag;
    if (!etag) throw new Error('El archivo no devolvió un ETag para revalidar.');

    const revalidada = await request(app).get(`/uploads/${archivo}`).set('If-None-Match', etag);
    expect(revalidada.status).toBe(304);
    expect(revalidada.headers['cache-control']).toBe('public, no-cache');
    expect(revalidada.headers['cross-origin-resource-policy']).toBe('cross-origin');
    if (archivo.endsWith('.pdf')) expect(revalidada.headers['x-frame-options']).toBeUndefined();
  });

  it('devuelve una versión nueva si cambia el archivo', async () => {
    const primera = await request(app).get('/uploads/imagen.png');
    const etag = primera.headers.etag;
    if (!etag) throw new Error('El archivo no devolvió un ETag para revalidar.');
    await writeFile(path.join(directorio, 'imagen.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x01]));
    const actualizada = await request(app).get('/uploads/imagen.png').set('If-None-Match', etag);
    expect(actualizada.status).toBe(200);
    expect(actualizada.headers.etag).not.toBe(etag);
    expect(actualizada.headers['cache-control']).toBe('public, no-cache');
  });
});

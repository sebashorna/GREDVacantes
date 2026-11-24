// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { urlArchivoParaMostrar } from '@/lib/url-archivo';
import { VistaPreviaArchivo } from './VistaPreviaArchivo';

afterEach(cleanup);

describe('archivos subidos en la vista previa', () => {
  const base = 'http://localhost:3000/uploads/b008bced-c16d-4485-9687-9848285d4457';

  it('usa una URL nueva para la imagen ya almacenada', () => {
    render(<VistaPreviaArchivo url={`${base}.png`} titulo="Imagen de prueba" tipo="imagen">Ver imagen</VistaPreviaArchivo>);
    fireEvent.click(screen.getByRole('button', { name: 'Ver Imagen de prueba' }));
    expect(screen.getByRole('img', { name: 'Imagen de prueba' }).getAttribute('src')).toBe(`${base}.png?v=3`);
  });

  it('usa una URL nueva para el PDF y conserva otras URL sin cambios', () => {
    render(<VistaPreviaArchivo url={`${base}.pdf`} titulo="PDF de prueba" tipo="documento">Ver PDF</VistaPreviaArchivo>);
    fireEvent.click(screen.getByRole('button', { name: 'Ver PDF de prueba' }));
    expect(screen.getByTitle('PDF de prueba').getAttribute('src')).toBe(`${base}.pdf?v=3`);
    expect(urlArchivoParaMostrar('https://ejemplo.test/imagen.png?firma=123')).toBe('https://ejemplo.test/imagen.png?firma=123');
    expect(urlArchivoParaMostrar(`${base}.pdf?firma=123`)).toBe(`${base}.pdf?firma=123`);
    expect(urlArchivoParaMostrar('data:image/png;base64,AAAA')).toBe('data:image/png;base64,AAAA');
  });
});

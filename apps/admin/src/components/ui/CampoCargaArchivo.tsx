import { useState, type ChangeEvent } from 'react';
import { isAxiosError } from 'axios';
import { FileImage, FileText, Trash2, Upload } from 'lucide-react';

import { normalizarError, api } from '@/lib/api';

type TipoArchivo = 'imagen' | 'pdf';

interface CampoCargaArchivoProps {
  etiqueta: string;
  tipo: TipoArchivo;
  archivos: string[];
  onChange: (archivos: string[]) => void;
  onSubiendoChange?: (subiendo: boolean) => void;
  maxArchivos?: number;
}

const TAMANO_MAXIMO_ARCHIVO = 2 * 1024 * 1024;
const TAMANO_MAXIMO_TOTAL = 2 * 1024 * 1024;
const TAMANO_MAXIMO_SERVIDOR = 10 * 1024 * 1024;
const MIMES_IMAGEN_PERMITIDOS = ['image/avif', 'image/jpeg', 'image/png', 'image/webp'];

function bytesEnDataUrl(valor: string): number {
  const base64 = valor.match(/^data:[^,]*;base64,(.*)$/)?.[1];
  return base64 ? Math.floor((base64.length * 3) / 4) : 0;
}

function leerArchivoComoDataUrl(archivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onerror = () => reject(new Error(`No se pudo leer el archivo ${archivo.name}.`));
    lector.onload = () => {
      if (typeof lector.result !== 'string') {
        reject(new Error(`No se pudo procesar el archivo ${archivo.name}.`));
        return;
      }
      resolve(lector.result);
    };
    lector.readAsDataURL(archivo);
  });
}

export function CampoCargaArchivo({
  etiqueta,
  tipo,
  archivos,
  onChange,
  onSubiendoChange,
  maxArchivos = 1,
}: CampoCargaArchivoProps) {
  const [error, setError] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const modoDemo = import.meta.env.VITE_APP_DEMO === 'true';
  const Icono = tipo === 'imagen' ? FileImage : FileText;

  async function seleccionarArchivos(evento: ChangeEvent<HTMLInputElement>) {
    const seleccionados = Array.from(evento.target.files ?? []);
    evento.target.value = '';
    setError('');
    if (!seleccionados.length) return;

    const archivosExistentes = tipo === 'pdf' ? [] : archivos;
    if (archivosExistentes.length + seleccionados.length > maxArchivos) {
      setError(`Puedes adjuntar hasta ${maxArchivos} ${tipo === 'imagen' ? 'imágenes' : 'archivo PDF'}.`);
      return;
    }

    for (const archivo of seleccionados) {
      const formatoValido = tipo === 'imagen'
        ? MIMES_IMAGEN_PERMITIDOS.includes(archivo.type)
        : archivo.type === 'application/pdf';
      if (!formatoValido) {
        setError(tipo === 'imagen'
          ? 'Selecciona imágenes PNG, JPG, WebP o AVIF.'
          : 'Selecciona un archivo PDF.');
        return;
      }
      if (archivo.size > (modoDemo ? TAMANO_MAXIMO_ARCHIVO : TAMANO_MAXIMO_SERVIDOR)) {
        setError(`Cada archivo debe pesar como máximo ${modoDemo ? '2' : '10'} MB.`);
        return;
      }
    }

    if (modoDemo) {
      const bytesActuales = archivosExistentes.reduce((total, archivo) => total + bytesEnDataUrl(archivo), 0);
      const bytesNuevos = seleccionados.reduce((total, archivo) => total + archivo.size, 0);
      if (bytesActuales + bytesNuevos > TAMANO_MAXIMO_TOTAL) {
        setError('El tamaño total de los archivos adjuntos no puede superar 2 MB.');
        return;
      }
    }

    setSubiendo(true);
    onSubiendoChange?.(true);
    try {
      if (modoDemo) {
        const contenidos = await Promise.all(seleccionados.map(leerArchivoComoDataUrl));
        onChange([...archivosExistentes, ...contenidos]);
      } else {
        let cargados = archivosExistentes;
        for (const archivo of seleccionados) {
          const formulario = new FormData();
          formulario.append('tipo', tipo);
          formulario.append('archivo', archivo);
          const { data } = await api.post<{ url: string }>('/archivos', formulario, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          if (!data.url) throw new Error('El servidor no devolvió la dirección del archivo cargado.');
          cargados = [...cargados, data.url];
          onChange(cargados);
        }
      }
    } catch (causa) {
      setError(
        isAxiosError(causa)
          ? normalizarError(causa).message
          : causa instanceof Error
            ? causa.message
            : 'No se pudo cargar el archivo.',
      );
    } finally {
      setSubiendo(false);
      onSubiendoChange?.(false);
    }
  }

  function quitarArchivo(archivoAQuitar: string) {
    if (subiendo) return;
    onChange(archivos.filter((archivo) => archivo !== archivoAQuitar));
    setError('');
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-on-surface">{etiqueta}</p>
      <label className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-outline-variant px-4 py-2 text-sm font-semibold text-primary transition hover:bg-surface-container-low ${subiendo ? 'cursor-wait opacity-60' : 'cursor-pointer'}`}>
        <Upload size={17} />
        {subiendo ? 'Subiendo archivo...' : tipo === 'imagen' ? 'Seleccionar imágenes' : 'Seleccionar PDF'}
        <input
          type="file"
          accept={tipo === 'imagen' ? 'image/avif,image/jpeg,image/png,image/webp' : 'application/pdf'}
          multiple={tipo === 'imagen'}
          disabled={subiendo}
          onChange={(evento) => void seleccionarArchivos(evento)}
          className="sr-only"
        />
      </label>
      <p className="text-xs text-on-surface-variant">
        {modoDemo
          ? `${tipo === 'imagen' ? 'PNG, JPG, WebP o AVIF' : 'PDF'} · máximo 2 MB por archivo y 2 MB en total. Se guarda solo en este dispositivo.`
          : `${tipo === 'imagen' ? 'PNG, JPG, WebP o AVIF' : 'PDF'} · máximo 10 MB por archivo. El archivo se guarda en el servidor.`}
      </p>
      {error && <p role="alert" className="text-xs font-medium text-error">{error}</p>}
      {archivos.length > 0 && (
        <ul className="space-y-1">
          {archivos.map((archivo, indice) => (
            <li key={`${archivo.slice(0, 40)}-${indice}`} className="flex items-center justify-between gap-3 rounded-lg bg-surface-container-low px-3 py-2 text-xs">
              <span className="flex min-w-0 items-center gap-2 text-on-surface-variant">
                <Icono size={15} className="shrink-0 text-primary" />
                <span className="truncate">
                  {archivo.startsWith('data:')
                    ? `${tipo === 'imagen' ? 'Imagen adjunta' : 'PDF adjunto'} ${indice + 1}`
                    : `Archivo ${tipo === 'imagen' ? 'de imagen' : 'PDF'} ${indice + 1}`}
                </span>
              </span>
              <button
                type="button"
                onClick={() => quitarArchivo(archivo)}
                disabled={subiendo}
                aria-label={`Quitar ${tipo === 'imagen' ? 'imagen' : 'PDF'} adjunto ${indice + 1}`}
                className="shrink-0 rounded p-1 text-on-surface-variant hover:bg-white hover:text-error"
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

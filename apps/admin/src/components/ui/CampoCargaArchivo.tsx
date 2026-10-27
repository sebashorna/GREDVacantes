import { useState, type ChangeEvent } from 'react';
import { FileImage, FileText, Trash2, Upload } from 'lucide-react';

type TipoArchivo = 'imagen' | 'pdf';

interface CampoCargaArchivoProps {
  etiqueta: string;
  tipo: TipoArchivo;
  archivos: string[];
  onChange: (archivos: string[]) => void;
  maxArchivos?: number;
}

const TAMANO_MAXIMO_ARCHIVO = 2 * 1024 * 1024;
const TAMANO_MAXIMO_TOTAL = 2 * 1024 * 1024;
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
  maxArchivos = 1,
}: CampoCargaArchivoProps) {
  const [error, setError] = useState('');
  const modoDemo = import.meta.env.VITE_APP_DEMO === 'true';
  const archivosLocales = archivos.filter((archivo) => archivo.startsWith('data:'));
  const Icono = tipo === 'imagen' ? FileImage : FileText;

  async function seleccionarArchivos(evento: ChangeEvent<HTMLInputElement>) {
    const seleccionados = Array.from(evento.target.files ?? []);
    evento.target.value = '';
    setError('');
    if (!seleccionados.length) return;

    if (!modoDemo) {
      setError('La carga de archivos estará disponible cuando se configure el almacenamiento del servidor.');
      return;
    }

    if (archivos.length + seleccionados.length > maxArchivos) {
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
      if (archivo.size > TAMANO_MAXIMO_ARCHIVO) {
        setError('Cada archivo debe pesar como máximo 2 MB.');
        return;
      }
    }

    const bytesActuales = archivos.reduce((total, archivo) => total + bytesEnDataUrl(archivo), 0);
    const bytesNuevos = seleccionados.reduce((total, archivo) => total + archivo.size, 0);
    if (bytesActuales + bytesNuevos > TAMANO_MAXIMO_TOTAL) {
      setError('El tamaño total de los archivos adjuntos no puede superar 2 MB.');
      return;
    }

    try {
      const contenidos = await Promise.all(seleccionados.map(leerArchivoComoDataUrl));
      onChange([...archivos, ...contenidos]);
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudieron leer los archivos seleccionados.');
    }
  }

  function quitarArchivo(archivoAQuitar: string) {
    onChange(archivos.filter((archivo) => archivo !== archivoAQuitar));
    setError('');
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-on-surface">{etiqueta}</p>
      <label className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-outline-variant px-4 py-2 text-sm font-semibold text-primary transition hover:bg-surface-container-low ${!modoDemo ? 'cursor-not-allowed opacity-60' : ''}`}>
        <Upload size={17} />
        {tipo === 'imagen' ? 'Seleccionar imágenes' : 'Seleccionar PDF'}
        <input
          type="file"
          accept={tipo === 'imagen' ? 'image/avif,image/jpeg,image/png,image/webp' : 'application/pdf'}
          multiple={tipo === 'imagen'}
          disabled={!modoDemo}
          onChange={(evento) => void seleccionarArchivos(evento)}
          className="sr-only"
        />
      </label>
      <p className="text-xs text-on-surface-variant">
        {modoDemo
          ? `${tipo === 'imagen' ? 'PNG, JPG, WebP o AVIF' : 'PDF'} · máximo 2 MB por archivo y 2 MB en total. Se guarda solo en este dispositivo.`
          : 'La carga de archivos requiere almacenamiento en el servidor; por ahora puedes pegar una URL en el campo correspondiente.'}
      </p>
      {error && <p role="alert" className="text-xs font-medium text-error">{error}</p>}
      {archivosLocales.length > 0 && (
        <ul className="space-y-1">
          {archivosLocales.map((archivo, indice) => (
            <li key={`${archivo.slice(0, 40)}-${indice}`} className="flex items-center justify-between gap-3 rounded-lg bg-surface-container-low px-3 py-2 text-xs">
              <span className="flex min-w-0 items-center gap-2 text-on-surface-variant">
                <Icono size={15} className="shrink-0 text-primary" />
                <span className="truncate">{tipo === 'imagen' ? `Imagen adjunta ${indice + 1}` : 'PDF adjunto'}</span>
              </span>
              <button
                type="button"
                onClick={() => quitarArchivo(archivo)}
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

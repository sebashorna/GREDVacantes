import { useState, type ReactNode } from 'react';
import { ExternalLink, FileText } from 'lucide-react';

import { Modal } from '@/components/ui/Modal';

interface VistaPreviaArchivoProps {
  url: string;
  titulo: string;
  tipo?: 'imagen' | 'documento' | 'auto';
  children: ReactNode;
}

function esUrlWeb(valor: string): boolean {
  if (/^data:(?:image\/(?:avif|jpeg|png|webp)|application\/pdf);base64,/i.test(valor)) return true;
  if (valor.startsWith('/') && !valor.startsWith('//')) return true;
  try {
    const url = new URL(valor);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function esImagen(valor: string): boolean {
  if (/^data:image\/(?:avif|jpeg|png|webp);base64,/i.test(valor)) return true;
  try {
    return /\.(avif|gif|jpe?g|png|svg|webp)$/i.test(
      new URL(valor, window.location.origin).pathname,
    );
  } catch {
    return false;
  }
}

export function VistaPreviaArchivo({
  url,
  titulo,
  tipo = 'auto',
  children,
}: VistaPreviaArchivoProps) {
  const [abierto, setAbierto] = useState(false);
  const urlValida = esUrlWeb(url);
  const esVistaDeImagen = urlValida && (tipo === 'imagen' || (tipo === 'auto' && esImagen(url)));

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        disabled={!urlValida}
        aria-label={`Ver ${titulo}`}
        className="disabled:cursor-not-allowed"
      >
        {children}
      </button>
      <Modal
        abierto={abierto && urlValida}
        onCerrar={() => setAbierto(false)}
        titulo={titulo}
        ancho="xl"
      >
        {esVistaDeImagen ? (
          <div className="flex min-h-[50vh] items-center justify-center rounded-lg bg-on-surface p-2">
            <img src={url} alt={titulo} className="max-h-[70vh] max-w-full object-contain" />
          </div>
        ) : (
          <div className="h-[70vh] min-h-[24rem] overflow-hidden rounded-lg border border-outline-variant bg-surface-container-low">
            <iframe
              src={url}
              title={titulo}
              className="h-full w-full"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
        <div className="mt-3 flex justify-end">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <FileText size={15} />
            Abrir original
            <ExternalLink size={14} />
          </a>
        </div>
      </Modal>
    </>
  );
}

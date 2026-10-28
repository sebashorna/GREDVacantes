import { useEffect, useState, type ReactNode } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { ExternalLink, FileText } from 'lucide-react';

import { Modal } from '@/components/ui/Modal';

interface PdfRenderPlugin {
  renderizar(opciones: { url: string }): Promise<{ paginas: string[]; total: number }>;
}

const PdfRender = registerPlugin<PdfRenderPlugin>('PdfRender');

function esPdfNativo(valor: string): boolean {
  if (!Capacitor.isNativePlatform() || !/\.pdf$/i.test(valor)) return false;
  if (valor.startsWith('/') && !valor.startsWith('//')) return true;
  try {
    const url = new URL(valor);
    return (
      (url.protocol === 'https:' || url.protocol === 'http:') &&
      url.pathname.startsWith('/uploads/')
    );
  } catch {
    return false;
  }
}

function PaginasPdfNativo({ url, titulo }: { url: string; titulo: string }) {
  const [paginas, setPaginas] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    PdfRender.renderizar({ url })
      .then((r) => activo && setPaginas(r.paginas))
      .catch((causa: unknown) =>
        activo && setError(causa instanceof Error ? causa.message : 'Error desconocido'),
      );
    return () => {
      activo = false;
    };
  }, [url]);

  if (error) return <p role="alert" className="p-6 text-center text-sm text-error">No se pudo mostrar el documento: {error}</p>;
  if (!paginas) return <p className="p-6 text-center text-sm text-on-surface-variant">Cargando documento...</p>;
  return (
    <div className="max-h-[70vh] space-y-3 overflow-y-auto rounded-lg bg-surface-container p-2">
      {paginas.map((src, i) => (
        <img key={i} src={src} alt={`${titulo}, página ${i + 1}`} className="w-full rounded bg-white shadow-sm" />
      ))}
    </div>
  );
}

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
  const esPdfMovil = esPdfNativo(url);

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
        ) : esPdfMovil ? (
          <PaginasPdfNativo url={url} titulo={titulo} />
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
        {!esPdfMovil && (
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
        )}
      </Modal>
    </>
  );
}

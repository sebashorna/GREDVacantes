import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

/**
 * Panel modal centrado con overlay (spec DESIGN.md: modal = elevacion
 * nivel 3, radio 1.5rem en la parte superior del sheet; aqui se usa
 * radio completo por ser panel centrado).
 */
interface ModalProps {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  children: ReactNode;
  /** Ancho maximo del panel. */
  ancho?: 'md' | 'lg' | 'xl';
  /** Pie del modal (botones de accion). */
  pie?: ReactNode;
}

const ANCHOS = { md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl' } as const;

export function Modal({ abierto, onCerrar, titulo, children, ancho = 'lg', pie }: ModalProps) {
  useEffect(() => {
    if (!abierto) return;
    const onTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar();
    };
    document.addEventListener('keydown', onTecla);
    return () => document.removeEventListener('keydown', onTecla);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40"
      onClick={onCerrar}
      role="presentation"
    >
      <div
        className={`w-full ${ANCHOS[ancho]} bg-white rounded-xl shadow-lg max-h-[90vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
          <h2 className="text-lg font-bold text-on-surface">{titulo}</h2>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="p-2 rounded-lg hover:bg-surface-container transition text-on-surface-variant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>
        {pie && (
          <div className="px-6 py-4 border-t border-outline-variant flex justify-end gap-3 bg-surface-container-low rounded-b-xl">
            {pie}
          </div>
        )}
      </div>
    </div>
  );
}

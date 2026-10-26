import { useState, type ReactNode } from 'react';
import { Check, ChevronDown, RotateCcw, SlidersHorizontal } from 'lucide-react';

interface PanelFiltrosProps {
  filtrosActivos: string[];
  onAplicar: () => void;
  onLimpiar: () => void;
  children: ReactNode;
}

export function PanelFiltros({
  filtrosActivos,
  onAplicar,
  onLimpiar,
  children,
}: PanelFiltrosProps) {
  const [abierto, setAbierto] = useState(false);

  const aplicar = () => {
    onAplicar();
    setAbierto(false);
  };

  return (
    <section className="rounded-xl border border-outline-variant bg-white">
      <div className="flex flex-wrap items-center gap-2 p-3">
        <button
          type="button"
          aria-expanded={abierto}
          aria-controls="panel-filtros"
          onClick={() => setAbierto((actual) => !actual)}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-outline-variant px-3 text-sm font-semibold text-on-surface hover:bg-surface-container-low"
        >
          <SlidersHorizontal size={16} className="text-primary" />
          Filtros
          {filtrosActivos.length > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-container px-1.5 text-xs text-on-primary">
              {filtrosActivos.length}
            </span>
          )}
          <ChevronDown size={16} className={`transition-transform ${abierto ? 'rotate-180' : ''}`} />
        </button>

        {filtrosActivos.length > 0 ? (
          <div className="flex min-w-0 flex-wrap gap-1.5" aria-label="Filtros aplicados">
            {filtrosActivos.map((filtro) => (
              <span
                key={filtro}
                className="inline-flex max-w-full items-center rounded-full bg-surface-container-low px-2.5 py-1 text-xs font-medium text-on-surface-variant"
              >
                <span className="truncate">{filtro}</span>
              </span>
            ))}
          </div>
        ) : (
          <span className="text-sm text-on-surface-variant">Sin filtros aplicados</span>
        )}
      </div>

      <div id="panel-filtros" hidden={!abierto} className="space-y-4 border-t border-outline-variant/70 p-4">
        {children}
        <div className="flex flex-wrap justify-end gap-2 border-t border-outline-variant/60 pt-3">
          <button
            type="button"
            onClick={onLimpiar}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-outline-variant px-3 text-sm font-medium text-on-surface-variant hover:bg-surface-container-low"
          >
            <RotateCcw size={15} />
            Limpiar
          </button>
          <button
            type="button"
            onClick={aplicar}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary-container px-4 text-sm font-semibold text-on-primary hover:bg-primary"
          >
            <Check size={16} />
            Aplicar filtros
          </button>
        </div>
      </div>
    </section>
  );
}

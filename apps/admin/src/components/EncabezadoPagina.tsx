import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

import { Boton } from '@/components/ui/Boton';

/**
 * Encabezado estándar de las pantallas de gestión: título, descripción y
 * acción principal (oculta para roles de solo lectura).
 */
interface EncabezadoPaginaProps {
  titulo: string;
  descripcion: string;
  icono?: LucideIcon;
  accion?: { etiqueta: string; onClick: () => void };
  extra?: ReactNode;
}

export function EncabezadoPagina({ titulo, descripcion, icono: Icono, accion, extra }: EncabezadoPaginaProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {Icono && (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-container text-white shadow-sm">
            <Icono size={22} aria-hidden="true" />
          </span>
        )}
        <div>
          <h1 className="text-2xl font-bold text-on-surface">{titulo}</h1>
          <p className="text-sm text-on-surface-variant mt-1">{descripcion}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {extra}
        {accion && <Boton onClick={accion.onClick}>{accion.etiqueta}</Boton>}
      </div>
    </div>
  );
}

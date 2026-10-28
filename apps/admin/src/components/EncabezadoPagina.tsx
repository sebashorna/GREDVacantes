import { useSyncExternalStore, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';

import { Boton } from '@/components/ui/Boton';

const dos = (n: number) => String(n).padStart(2, '0');

function formatearActualizacion(marca: number): string {
  const f = new Date(marca);
  return `${dos(f.getHours())}:${dos(f.getMinutes())} ${dos(f.getDate())}/${dos(f.getMonth() + 1)}/${dos(f.getFullYear() % 100)}`;
}

function useUltimaActualizacion(): number {
  const cache = useQueryClient().getQueryCache();
  return useSyncExternalStore(
    (avisar) => cache.subscribe(avisar),
    () => cache.getAll().reduce((max, q) => (q.state.status === 'success' ? Math.max(max, q.state.dataUpdatedAt) : max), 0),
  );
}

export function ActualizadoEn() {
  const ultima = useUltimaActualizacion();
  const modoConsulta =
    import.meta.env.VITE_APP_MOBILE === 'true' || window.location.pathname === '/app/consulta';
  if (!modoConsulta || ultima === 0) return null;
  return (
    <p className="mt-0.5 text-xs text-on-surface-variant" aria-live="polite">
      Actualizado {formatearActualizacion(ultima)}
    </p>
  );
}

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
          <ActualizadoEn />
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

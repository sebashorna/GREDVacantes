import { CalendarClock } from 'lucide-react';

const dos = (n: number) => String(n).padStart(2, '0');

/** Indicador pequeño con la última actualización de un registro: "Actualizado HH:MM DD/MM/AA". */
export function ActualizadoRegistro({ fecha, className = '' }: { fecha?: string | null; className?: string }) {
  if (!fecha) return null;
  const f = new Date(fecha);
  if (Number.isNaN(f.getTime())) return null;
  const texto = `${dos(f.getHours())}:${dos(f.getMinutes())} ${dos(f.getDate())}/${dos(f.getMonth() + 1)}/${dos(f.getFullYear() % 100)}`;
  return (
    <span className={`inline-flex items-center gap-1 text-xs text-on-surface-variant ${className}`}>
      <CalendarClock size={13} aria-hidden="true" />
      <time dateTime={fecha}>Actualizado {texto}</time>
    </span>
  );
}

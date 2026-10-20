import type { ReactNode } from 'react';

/**
 * Chips de estado (spec DESIGN.md: altura 32px, píldora, fondo tonal con
 * texto oscuro legible).
 */
export type TonoBadge = 'exito' | 'advertencia' | 'error' | 'info' | 'neutro';

const TONOS: Record<TonoBadge, string> = {
  exito: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  advertencia: 'bg-secondary-fixed text-on-secondary-fixed-variant',
  error: 'bg-error-container text-on-error-container',
  info: 'bg-primary-fixed text-on-primary-fixed-variant',
  neutro: 'bg-surface-container text-on-surface-variant',
};

interface BadgeProps {
  tono?: TonoBadge;
  children: ReactNode;
  className?: string;
}

export function Badge({ tono = 'neutro', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center h-8 px-3 rounded-full text-xs font-semibold whitespace-nowrap ${TONOS[tono]} ${className}`}
    >
      {children}
    </span>
  );
}

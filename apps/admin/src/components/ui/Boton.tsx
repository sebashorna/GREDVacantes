import type { ButtonHTMLAttributes, ReactNode } from 'react';

/**
 * Boton del design system "Tierra Santa".
 *
 * Spec DESIGN.md: altura 48px (md), radio 0.5rem, primario #A0472E con
 * texto blanco que oscurece al presionar (#813019), secundario soft
 * terracota con borde translucido.
 */
type Variante = 'primario' | 'secundario' | 'peligro' | 'fantasma';
type Tamano = 'md' | 'sm';

export interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamano?: Tamano;
  children: ReactNode;
}

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

const TAMANOS: Record<Tamano, string> = {
  md: 'h-12 px-5 text-sm',
  sm: 'h-9 px-3 text-xs',
};

const VARIANTES: Record<Variante, string> = {
  // Spec: Background #A0472E -> hover/pressed #813019, texto blanco.
  primario: 'bg-primary-container text-white hover:bg-primary active:bg-primary',
  // Spec: Terracota Soft -> fondo 8%, texto #A0472E, borde 20%.
  secundario:
    'bg-primary-container/10 text-primary-container border border-primary-container/30 hover:bg-primary-container/20',
  peligro: 'bg-error text-on-error hover:opacity-90',
  fantasma: 'text-on-surface-variant hover:bg-surface-container',
};

export function Boton({
  variante = 'primario',
  tamano = 'md',
  className = '',
  type = 'button',
  children,
  ...props
}: BotonProps) {
  return (
    <button
      type={type}
      className={`${BASE} ${TAMANOS[tamano]} ${VARIANTES[variante]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

import { useId } from 'react';

/**
 * Campos de formulario del design system "Tierra Santa".
 *
 * Spec DESIGN.md: altura 48px, borde 1.5px #DCC1BA (outline-variant),
 * radio 0.5rem, focus con borde terracota y halo suave.
 */

const CLASE_BASE =
  'w-full h-12 px-3.5 rounded-lg border-[1.5px] border-outline-variant bg-white text-on-surface outline-none transition placeholder:text-on-surface-variant/60 focus:border-primary-container focus:shadow-[0_0_0_3px_rgba(160,71,46,0.15)]';

/* ------------------------------------------------------------------ */
/* Texto / numero / fecha                                              */
/* ------------------------------------------------------------------ */

interface CampoTextoProps {
  etiqueta: string;
  valor: string;
  onChange: (valor: string) => void;
  error?: string;
  ayuda?: string;
  tipo?: 'text' | 'number' | 'date' | 'email' | 'password' | 'search' | 'tel' | 'url';
  placeholder?: string;
  deshabilitado?: boolean;
  min?: number;
  max?: number;
  paso?: number | 'any';
}

export function CampoTexto({
  etiqueta,
  valor,
  onChange,
  error,
  ayuda,
  tipo = 'text',
  placeholder,
  deshabilitado,
  min,
  max,
  paso,
}: CampoTextoProps) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-label">
        {etiqueta}
      </label>
      <input
        id={id}
        type={tipo}
        value={valor}
        min={min}
        max={max}
        step={paso}
        placeholder={placeholder}
        disabled={deshabilitado}
        onChange={(e) => onChange(e.target.value)}
        className={`${CLASE_BASE} disabled:bg-surface-container disabled:cursor-not-allowed`}
      />
      {ayuda && !error && <p className="text-xs text-on-surface-variant">{ayuda}</p>}
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Area de texto                                                       */
/* ------------------------------------------------------------------ */

interface CampoAreaProps {
  etiqueta: string;
  valor: string;
  onChange: (valor: string) => void;
  error?: string;
  ayuda?: string;
  placeholder?: string;
  filas?: number;
}

export function CampoArea({ etiqueta, valor, onChange, error, ayuda, placeholder, filas = 4 }: CampoAreaProps) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-label">
        {etiqueta}
      </label>
      <textarea
        id={id}
        value={valor}
        rows={filas}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-h-24 px-3.5 py-2.5 rounded-lg border-[1.5px] border-outline-variant bg-white text-on-surface outline-none transition placeholder:text-on-surface-variant/60 focus:border-primary-container focus:shadow-[0_0_0_3px_rgba(160,71,46,0.15)]"
      />
      {ayuda && !error && <p className="text-xs text-on-surface-variant">{ayuda}</p>}
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Select                                                              */
/* ------------------------------------------------------------------ */

export interface OpcionSelect {
  valor: string | number;
  etiqueta: string;
}

interface CampoSelectProps {
  etiqueta: string;
  valor: string | number | '';
  onChange: (valor: string) => void;
  opciones: OpcionSelect[];
  error?: string;
  ayuda?: string;
  placeholder?: string;
  deshabilitado?: boolean;
}

export function CampoSelect({
  etiqueta,
  valor,
  onChange,
  opciones,
  error,
  ayuda,
  placeholder = 'Seleccione...',
  deshabilitado,
}: CampoSelectProps) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-label">
        {etiqueta}
      </label>
      <select
        id={id}
        value={valor}
        disabled={deshabilitado}
        onChange={(e) => onChange(e.target.value)}
        className={`${CLASE_BASE} cursor-pointer disabled:bg-surface-container disabled:cursor-not-allowed [&>option]:bg-white`}
      >
        <option value="">{placeholder}</option>
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.etiqueta}
          </option>
        ))}
      </select>
      {ayuda && !error && <p className="text-xs text-on-surface-variant">{ayuda}</p>}
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}

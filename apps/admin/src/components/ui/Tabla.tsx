import type { ReactNode } from 'react';

/**
 * Tabla generica de listados.
 *
 * Spec DESIGN.md: filas minimas 56px, divisores 1px sándrail, encabezados
 * con etiqueta uppercase, tarjeta blanca con borde outline-variant.
 */
export interface Columna<T> {
  /** Clave unica de la columna. */
  clave: string;
  /** Texto del encabezado. */
  encabezado: string;
  /** Renderiza el valor de la celda para la fila dada. */
  celda: (fila: T) => ReactNode;
  /** Clase extra para la columna (ancho, alineacion...). */
  clase?: string;
}

interface TablaProps<T> {
  columnas: Columna<T>[];
  filas: T[];
  /** Obtiene la clave unica de la fila. */
  claveFila: (fila: T) => string | number;
  cargando?: boolean;
  /** Contenido cuando no hay filas. */
  vacio?: ReactNode;
  /** Columna opcional de acciones (botones por fila). */
  acciones?: (fila: T) => ReactNode;
}

export function Tabla<T>({ columnas, filas, claveFila, cargando, vacio, acciones }: TablaProps<T>) {
  if (cargando) {
    return (
      <div className="p-10 text-center text-on-surface-variant">
        Cargando...
      </div>
    );
  }

  if (filas.length === 0) {
    return <div className="p-10 text-center text-on-surface-variant">{vacio ?? 'No hay registros.'}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-container-low">
            {columnas.map((c) => (
              <th
                key={c.clave}
                className={`text-left px-4 py-3 text-label border-b border-outline-variant ${c.clase ?? ''}`}
              >
                {c.encabezado}
              </th>
            ))}
            {acciones && (
              <th className="text-right px-4 py-3 text-label border-b border-outline-variant">Acciones</th>
            )}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr key={claveFila(fila)} className="border-b border-outline-variant last:border-0 hover:bg-surface-container-low/50 transition">
              {columnas.map((c) => (
                <td key={c.clave} className={`px-4 py-3 align-middle min-h-14 ${c.clase ?? ''}`}>
                  {c.celda(fila)}
                </td>
              ))}
              {acciones && <td className="px-4 py-3 text-right whitespace-nowrap">{acciones(fila)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

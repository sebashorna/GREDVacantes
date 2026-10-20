import { Boton } from './Boton';

/**
 * Controles de paginacion para respuestas `RespuestaPaginada` de la API.
 */
interface PaginacionProps {
  pagina: number;
  totalPaginas: number;
  total: number;
  onPagina: (pagina: number) => void;
  cargando?: boolean;
}

export function Paginacion({ pagina, totalPaginas, total, onPagina, cargando }: PaginacionProps) {
  if (total === 0) return null;

  const desde = (pagina - 1) * 20 + 1;
  const hasta = Math.min(pagina * 20, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-outline-variant">
      <p className="text-xs text-on-surface-variant">
        Mostrando <span className="font-semibold text-on-surface">{desde}–{hasta}</span> de{' '}
        <span className="font-semibold text-on-surface">{total}</span> registros
      </p>
      <div className="flex items-center gap-2">
        <Boton
          variante="secundario"
          tamano="sm"
          disabled={pagina <= 1 || cargando}
          onClick={() => onPagina(pagina - 1)}
        >
          Anterior
        </Boton>
        <span className="text-xs text-on-surface-variant">
          Página <span className="font-semibold text-on-surface">{pagina}</span> de{' '}
          <span className="font-semibold text-on-surface">{totalPaginas}</span>
        </span>
        <Boton
          variante="secundario"
          tamano="sm"
          disabled={pagina >= totalPaginas || cargando}
          onClick={() => onPagina(pagina + 1)}
        >
          Siguiente
        </Boton>
      </div>
    </div>
  );
}

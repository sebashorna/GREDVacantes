import { useCallback, useState } from 'react';

/**
 * Estado de paginacion/buscador para listados.
 *
 * Centraliza pagina, limite y termino de busqueda; cada pagina lo combina
 * con `useQuery` de React Query construyendo los params de la API.
 */
export function usePaginacion(limiteInicial = 20) {
  const [pagina, setPagina] = useState(1);
  const [limite] = useState(limiteInicial);
  const [busqueda, setBusquedaEstado] = useState('');

  /** Cambia la busqueda y vuelve a la primera pagina. */
  const setBusqueda = useCallback((valor: string) => {
    setBusquedaEstado(valor);
    setPagina(1);
  }, []);

  /** Params listos para enviar a la API (solo campos con valor). */
  const params = {
    page: pagina,
    limit: limite,
    ...(busqueda.trim() ? { search: busqueda.trim() } : {}),
  };

  /** Reinicia a la primera pagina (util tras crear/editar/eliminar). */
  const irAPrimera = useCallback(() => setPagina(1), []);

  return { pagina, limite, busqueda, setBusqueda, setPagina, params, irAPrimera };
}

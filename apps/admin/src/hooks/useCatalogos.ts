import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type { OpcionCatalogo, Pagina, InstitucionResumen } from '@/lib/tipos';

/**
 * Catálogos de apoyo para formularios y filtros del panel.
 *
 * Son de solo lectura y se cachean agresivamente (cambian poco).
 */

async function get<T>(url: string): Promise<T> {
  const { data } = await api.get<T>(url);
  return data;
}

export function useUgeles() {
  return useQuery({
    queryKey: ['catalogos', 'ugeles'],
    queryFn: () => get<OpcionCatalogo[]>('/catalogos/ugeles'),
    staleTime: 10 * 60_000,
  });
}

export function useProvincias() {
  return useQuery({
    queryKey: ['catalogos', 'provincias'],
    queryFn: () => get<OpcionCatalogo[]>('/catalogos/provincias'),
    staleTime: 10 * 60_000,
  });
}

export function useDistritos(provinciaId?: number | '') {
  return useQuery({
    queryKey: ['catalogos', 'distritos', provinciaId || 'todos'],
    queryFn: () =>
      get<OpcionCatalogo[]>(
        provinciaId ? `/catalogos/distritos?provinciaId=${provinciaId}` : '/catalogos/distritos',
      ),
    staleTime: 10 * 60_000,
  });
}

/**
 * Opciones de instituciones para selectores (búsqueda server-side con
 * límite alto; suficiente para los formularios del panel).
 */
export function useInstitucionesOpciones(busqueda = '') {
  return useQuery({
    queryKey: ['instituciones', 'opciones', busqueda],
    queryFn: () =>
      get<Pagina<InstitucionResumen>>(
        `/instituciones?page=1&limit=100${busqueda.trim() ? `&search=${encodeURIComponent(busqueda.trim())}` : ''}`,
      ),
    staleTime: 60_000,
  });
}

export interface ConvocatoriaOpcion {
  id: number;
  titulo: string;
  numeroRD: string;
  fase: string;
  activo: boolean;
}

/** Convocatorias activas para el selector del formulario de plazas. */
export function useConvocatoriasActivas() {
  return useQuery({
    queryKey: ['convocatorias', 'activas'],
    queryFn: () =>
      get<Pagina<ConvocatoriaOpcion>>('/convocatorias?page=1&limit=100&activo=true'),
    staleTime: 60_000,
  });
}

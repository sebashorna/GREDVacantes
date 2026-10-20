import type { RespuestaPaginada } from '@educa/shared';

export interface ParamsPaginacion {
  page: number;
  limit: number;
}

export interface ResultadoPaginado<T> extends RespuestaPaginada<T> {}

/**
 * Ejecuta una consulta paginada de Prisma y devuelve el envelope estandar.
 *
 * `totalPages` es 0 cuando no hay registros, para que el panel pueda
 * distinguir "sin datos" de "pagina 1 de 0".
 */
export async function paginar<T, TArgs extends { where?: unknown }>(
  delegate: {
    findMany(args: unknown): Promise<T[]>;
    count(args: unknown): Promise<number>;
  },
  args: TArgs,
  { page, limit }: ParamsPaginacion,
): Promise<ResultadoPaginado<T>> {
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    delegate.findMany({ ...args, skip, take: limit }),
    delegate.count({ where: args.where }),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Normaliza el parametro de ordenamiento, validando contra una lista blanca.
 *
 * Sin esta validacion, un `sortBy` arbitrario llega a Prisma y puede
 * provocar un error 500 o, en el peor caso, consultas sobre campos internos.
 */
export function ordenSeguro(
  sortBy: string | undefined,
  permitido: readonly string[],
  porDefecto: string,
): Record<string, 'asc' | 'desc'> {
  const campo = sortBy && permitido.includes(sortBy) ? sortBy : porDefecto;
  return { [campo]: 'asc' };
}

/**
 * Igual que `ordenSeguro`, pero respetando el sentido indicado por el cliente.
 */
export function ordenSeguroConDireccion(
  sortBy: string | undefined,
  permitido: readonly string[],
  porDefecto: string,
  direccion: 'asc' | 'desc' | undefined,
): Record<string, 'asc' | 'desc'> {
  const base = ordenSeguro(sortBy, permitido, porDefecto);
  const campo = Object.keys(base)[0] ?? porDefecto;
  return { [campo]: direccion ?? 'asc' };
}

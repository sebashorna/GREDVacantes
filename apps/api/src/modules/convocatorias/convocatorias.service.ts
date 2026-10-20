import { Prisma } from '@prisma/client';

import { prisma } from '../../config/prisma.js';
import { AppError } from '../../common/errors.js';
import { paginar, ordenSeguro } from '../../common/paginacion.js';
import {
  convocatoriaCreateSchema,
  convocatoriaUpdateSchema,
  type ConvocatoriaCreateInput,
  type ConvocatoriaUpdateInput,
} from '@educa/shared';

const CAMPOS_ORDEN = ['fechaInicio', 'fechaFin', 'titulo', 'createdAt'] as const;

const INCLUYE = {
  _count: { select: { plazas: true } },
} as const;

export interface FiltrosConvocatorias {
  page: number;
  limit: number;
  search?: string;
  fase?: string;
  activo?: boolean;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export async function listar(filtros: FiltrosConvocatorias) {
  const where: Prisma.ConvocatoriaWhereInput = {
    ...(filtros.fase ? { fase: filtros.fase as never } : {}),
    ...(filtros.activo !== undefined ? { activo: filtros.activo } : {}),
    ...(filtros.search
      ? {
          OR: [
            { titulo: { contains: filtros.search, mode: 'insensitive' } },
            { numeroRD: { contains: filtros.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  return paginar(
    prisma.convocatoria,
    { where, include: INCLUYE, orderBy: ordenSeguro(filtros.sortBy, CAMPOS_ORDEN, 'fechaInicio') },
    { page: filtros.page, limit: filtros.limit },
  );
}

export async function obtenerPorId(id: number) {
  const convocatoria = await prisma.convocatoria.findUnique({
    where: { id },
    include: {
      ...INCLUYE,
      plazas: {
        orderBy: { id: 'asc' },
        include: { ie: { select: { id: true, nombre: true, codigoModular: true } } },
      },
    },
  });
  if (!convocatoria) throw AppError.noEncontrado('Convocatoria');
  return convocatoria;
}

export async function crear(datos: ConvocatoriaCreateInput) {
  const data = convocatoriaCreateSchema.parse(datos);
  return prisma.convocatoria.create({ data, include: INCLUYE });
}

export async function actualizar(id: number, datos: ConvocatoriaUpdateInput) {
  const data = convocatoriaUpdateSchema.parse(datos);
  const existe = await prisma.convocatoria.findUnique({ where: { id } });
  if (!existe) throw AppError.noEncontrado('Convocatoria');
  return prisma.convocatoria.update({ where: { id }, data, include: INCLUYE });
}

export async function eliminar(id: number) {
  const existe = await prisma.convocatoria.findUnique({ where: { id } });
  if (!existe) throw AppError.noEncontrado('Convocatoria');
  // Si tiene plazas asociadas no se borra fisicamente: se desactiva.
  const conteo = await prisma.convocatoria.findUnique({
    where: { id },
    select: { _count: { select: { plazas: true } } },
  });
  if (conteo && conteo._count.plazas > 0) {
    return prisma.convocatoria.update({ where: { id }, data: { activo: false } });
  }
  await prisma.convocatoria.delete({ where: { id } });
  return { id, eliminado: true };
}

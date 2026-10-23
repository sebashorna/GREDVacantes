import { Prisma } from '@prisma/client';

import { prisma } from '../../config/prisma.js';
import { AppError } from '../../common/errors.js';
import { paginar, ordenPorActualizacion } from '../../common/paginacion.js';
import {
  plazaCreateSchema,
  plazaUpdateSchema,
  type PlazaCreateInput,
  type PlazaUpdateInput,
} from '@educa/shared';

const CAMPOS_ORDEN = ['cantidad', 'createdAt', 'updatedAt', 'nivel', 'tipo'] as const;

const INCLUYE = {
  ie: {
    select: {
      id: true,
      nombre: true,
      codigoModular: true,
      ugel: { select: { id: true, nombre: true } },
      distrito: { select: { id: true, nombre: true } },
      provincia: { select: { id: true, nombre: true } },
    },
  },
  convocatoria: {
    select: {
      id: true,
      titulo: true,
      numeroRD: true,
      fase: true,
      descripcion: true,
      pdfMeritosUrl: true,
      fechaInicio: true,
      fechaFin: true,
    },
  },
} as const;

export interface FiltrosPlazas {
  page: number;
  limit: number;
  search?: string;
  ieId?: number;
  convocatoriaId?: number;
  ugelId?: number;
  tipo?: string;
  nivel?: string;
  estado?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export async function listar(filtros: FiltrosPlazas) {
  const where: Prisma.PlazaDocenteWhereInput = {
    ...(filtros.ieId ? { ieId: filtros.ieId } : {}),
    ...(filtros.convocatoriaId ? { convocatoriaId: filtros.convocatoriaId } : {}),
    ...(filtros.ugelId ? { ie: { ugelId: filtros.ugelId } } : {}),
    ...(filtros.tipo ? { tipo: filtros.tipo as never } : {}),
    ...(filtros.nivel ? { nivel: filtros.nivel as never } : {}),
    ...(filtros.estado ? { estado: filtros.estado as never } : {}),
    ...(filtros.search
      ? {
          OR: [
            { cargo: { contains: filtros.search, mode: 'insensitive' } },
            { area: { contains: filtros.search, mode: 'insensitive' } },
            { ie: { nombre: { contains: filtros.search, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  return paginar(
    prisma.plazaDocente,
    { where, include: INCLUYE, orderBy: ordenPorActualizacion(filtros.sortBy, CAMPOS_ORDEN) },
    { page: filtros.page, limit: filtros.limit },
  );
}

export async function obtenerPorId(id: number) {
  const plaza = await prisma.plazaDocente.findUnique({ where: { id }, include: INCLUYE });
  if (!plaza) throw AppError.noEncontrado('Plaza');
  return plaza;
}

export async function crear(datos: PlazaCreateInput) {
  const data = plazaCreateSchema.parse(datos);
  return prisma.plazaDocente.create({ data, include: INCLUYE });
}

export async function actualizar(id: number, datos: PlazaUpdateInput) {
  const data = plazaUpdateSchema.parse(datos);
  const existe = await prisma.plazaDocente.findUnique({ where: { id } });
  if (!existe) throw AppError.noEncontrado('Plaza');
  return prisma.plazaDocente.update({ where: { id }, data, include: INCLUYE });
}

export async function eliminar(id: number) {
  const existe = await prisma.plazaDocente.findUnique({ where: { id } });
  if (!existe) throw AppError.noEncontrado('Plaza');
  await prisma.plazaDocente.delete({ where: { id } });
  return { id, eliminado: true };
}

/** Totales de plazas por tipo y por UGEL, para el dashboard. */
export async function resumen() {
  const porTipo = await prisma.plazaDocente.groupBy({
    by: ['tipo'],
    _sum: { cantidad: true },
    _count: { _all: true },
  });
  const porEstado = await prisma.plazaDocente.groupBy({
    by: ['estado'],
    _sum: { cantidad: true },
    _count: { _all: true },
  });
  const porNivel = await prisma.plazaDocente.groupBy({
    by: ['nivel'],
    _sum: { cantidad: true },
    _count: { _all: true },
  });
  return { porTipo, porEstado, porNivel };
}

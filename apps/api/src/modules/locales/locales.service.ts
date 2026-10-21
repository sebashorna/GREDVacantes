import { Prisma } from '@prisma/client';

import { prisma } from '../../config/prisma.js';
import { AppError } from '../../common/errors.js';
import { paginar, ordenSeguro } from '../../common/paginacion.js';
import {
  localCreateSchema,
  localUpdateSchema,
  type EstadoLocal,
  type LocalCreateInput,
  type LocalUpdateInput,
} from '@educa/shared';

const CAMPOS_ORDEN = ['codigoLocal', 'estado', 'createdAt'] as const;
const ESTADOS_PRIORITARIOS: EstadoLocal[] = [
  'EN_REFRACCION',
  'AULAS_TEMPORALES',
  'ATENCION_PRIORITARIA',
];

const INCLUYE = {
  ie: {
    select: {
      id: true,
      nombre: true,
      codigoModular: true,
      ugel: { select: { id: true, nombre: true } },
      distrito: {
        select: {
          id: true,
          nombre: true,
          provincia: { select: { id: true, nombre: true } },
        },
      },
    },
  },
  _count: { select: { alertas: true } },
} as const;

export interface FiltrosLocales {
  page: number;
  limit: number;
  search?: string;
  estado?: string;
  ugelId?: number;
  provinciaId?: number;
  ieId?: number;
  prioritario?: boolean;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export async function listar(filtros: FiltrosLocales) {
  const where: Prisma.LocalEscolarWhereInput = {
    ...(filtros.estado || filtros.prioritario
      ? {
          AND: [
            ...(filtros.estado ? [{ estado: filtros.estado as never }] : []),
            ...(filtros.prioritario
              ? [{ estado: { in: ESTADOS_PRIORITARIOS } }]
              : []),
          ],
        }
      : {}),
    ...(filtros.ugelId ? { ie: { ugelId: filtros.ugelId } } : {}),
    ...(filtros.provinciaId ? { ie: { provinciaId: filtros.provinciaId } } : {}),
    ...(filtros.ieId ? { ieId: filtros.ieId } : {}),
    ...(filtros.search
      ? {
          OR: [
            { codigoLocal: { contains: filtros.search } },
            { ie: { nombre: { contains: filtros.search, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  return paginar(
    prisma.localEscolar,
    { where, include: INCLUYE, orderBy: ordenSeguro(filtros.sortBy, CAMPOS_ORDEN, 'createdAt') },
    { page: filtros.page, limit: filtros.limit },
  );
}

export async function obtenerPorId(id: number) {
  const local = await prisma.localEscolar.findUnique({
    where: { id },
    include: { ...INCLUYE, alertas: { orderBy: { createdAt: 'desc' } } },
  });
  if (!local) throw AppError.noEncontrado('Local escolar');
  return local;
}

export async function crear(datos: LocalCreateInput) {
  const data = localCreateSchema.parse(datos);
  return prisma.localEscolar.create({ data, include: INCLUYE });
}

export async function actualizar(id: number, datos: LocalUpdateInput) {
  const data = localUpdateSchema.parse(datos);
  const existe = await prisma.localEscolar.findUnique({ where: { id } });
  if (!existe) throw AppError.noEncontrado('Local escolar');
  return prisma.localEscolar.update({ where: { id }, data, include: INCLUYE });
}

export async function eliminar(id: number) {
  const existe = await prisma.localEscolar.findUnique({ where: { id } });
  if (!existe) throw AppError.noEncontrado('Local escolar');
  await prisma.localEscolar.delete({ where: { id } });
  return { id, eliminado: true };
}

/** Totales de locales por estado, para el dashboard. */
export async function resumen() {
  const porEstado = await prisma.localEscolar.groupBy({
    by: ['estado'],
    _count: { _all: true },
    _sum: { aulasOperativas: true, aulasTotales: true },
  });
  return { porEstado };
}

import { Prisma } from '@prisma/client';

import { prisma } from '../../config/prisma.js';
import { AppError } from '../../common/errors.js';
import { paginar, ordenSeguro } from '../../common/paginacion.js';
import {
  vacanteCreateSchema,
  vacanteUpdateSchema,
  type VacanteCreateInput,
  type VacanteUpdateInput,
} from '@educa/shared';

const CAMPOS_ORDEN = ['cupoTotal', 'cupoDisponibles', 'nivel', 'createdAt'] as const;

const INCLUYE = {
  ie: {
    select: {
      id: true,
      nombre: true,
      codigoModular: true,
      telefono: true,
      whatsapp: true,
      ugel: { select: { id: true, nombre: true } },
      distrito: { select: { id: true, nombre: true } },
      provincia: { select: { id: true, nombre: true } },
    },
  },
} as const;

export interface FiltrosVacantes {
  page: number;
  limit: number;
  search?: string;
  nivel?: string;
  turno?: string;
  estado?: string;
  ugelId?: number;
  ieId?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export async function listar(filtros: FiltrosVacantes) {
  const where: Prisma.VacanteMatriculaWhereInput = {
    ...(filtros.nivel ? { nivel: filtros.nivel as never } : {}),
    ...(filtros.turno ? { turno: filtros.turno as never } : {}),
    ...(filtros.estado ? { estado: filtros.estado as never } : {}),
    ...(filtros.ieId ? { ieId: filtros.ieId } : {}),
    ...(filtros.ugelId || filtros.search
      ? {
          ie: {
            ...(filtros.ugelId ? { ugelId: filtros.ugelId } : {}),
            ...(filtros.search
              ? { nombre: { contains: filtros.search, mode: 'insensitive' as const } }
              : {}),
          },
        }
      : {}),
  };

  return paginar(
    prisma.vacanteMatricula,
    { where, include: INCLUYE, orderBy: ordenSeguro(filtros.sortBy, CAMPOS_ORDEN, 'createdAt') },
    { page: filtros.page, limit: filtros.limit },
  );
}

export async function obtenerPorId(id: number) {
  const vacante = await prisma.vacanteMatricula.findUnique({
    where: { id },
    include: INCLUYE,
  });
  if (!vacante) throw AppError.noEncontrado('Vacante');
  return vacante;
}

export async function crear(datos: VacanteCreateInput) {
  const data = vacanteCreateSchema.parse(datos);
  return prisma.vacanteMatricula.create({ data, include: INCLUYE });
}

export async function actualizar(id: number, datos: VacanteUpdateInput) {
  const data = vacanteUpdateSchema.parse(datos);
  const existe = await prisma.vacanteMatricula.findUnique({ where: { id } });
  if (!existe) throw AppError.noEncontrado('Vacante');
  return prisma.vacanteMatricula.update({ where: { id }, data, include: INCLUYE });
}

export async function eliminar(id: number) {
  const existe = await prisma.vacanteMatricula.findUnique({ where: { id } });
  if (!existe) throw AppError.noEncontrado('Vacante');
  await prisma.vacanteMatricula.delete({ where: { id } });
  return { id, eliminado: true };
}

/**
 * Resumen de cupos para el dashboard: totales por nivel y estado.
 */
export async function resumenCupos() {
  const porNivel = await prisma.vacanteMatricula.groupBy({
    by: ['nivel'],
    _sum: { cupoTotal: true, cupoDisponibles: true },
    _count: { _all: true },
  });
  const porEstado = await prisma.vacanteMatricula.groupBy({
    by: ['estado'],
    _count: { _all: true },
    _sum: { cupoTotal: true, cupoDisponibles: true },
  });
  return { porNivel, porEstado };
}

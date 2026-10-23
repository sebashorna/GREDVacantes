import { Prisma } from '@prisma/client';

import { prisma } from '../../config/prisma.js';
import { AppError } from '../../common/errors.js';
import { paginar, ordenPorActualizacion } from '../../common/paginacion.js';
import {
  alertaCreateSchema,
  alertaEstadoSchema,
  type AlertaCreateInput,
  type AlertaEstadoInput,
} from '@educa/shared';

const CAMPOS_ORDEN = ['createdAt', 'updatedAt', 'tipo', 'estado'] as const;

const INCLUYE = {
  localEscolar: {
    select: {
      id: true,
      codigoLocal: true,
      estado: true,
      aulasOperativas: true,
      aulasTotales: true,
    },
  },
  ie: { select: { id: true, nombre: true, codigoModular: true } },
} as const;

export interface FiltrosAlertas {
  page: number;
  limit: number;
  search?: string;
  estado?: string;
  tipo?: string;
  ieId?: number;
  localEscolarId?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export async function listar(filtros: FiltrosAlertas) {
  const where: Prisma.AlertaCiudadanaWhereInput = {
    ...(filtros.estado ? { estado: filtros.estado as never } : {}),
    ...(filtros.tipo ? { tipo: filtros.tipo as never } : {}),
    ...(filtros.ieId ? { ieId: filtros.ieId } : {}),
    ...(filtros.localEscolarId ? { localEscolarId: filtros.localEscolarId } : {}),
    ...(filtros.search
      ? {
          OR: [
            { descripcion: { contains: filtros.search, mode: 'insensitive' } },
            { reportadoPor: { contains: filtros.search, mode: 'insensitive' } },
            { ie: { nombre: { contains: filtros.search, mode: 'insensitive' } } },
            { localEscolar: { codigoLocal: { contains: filtros.search } } },
          ],
        }
      : {}),
  };

  return paginar(
    prisma.alertaCiudadana,
    {
      where,
      include: INCLUYE,
      orderBy: ordenPorActualizacion(filtros.sortBy, CAMPOS_ORDEN),
    },
    { page: filtros.page, limit: filtros.limit },
  );
}

export async function obtenerPorId(id: number) {
  const alerta = await prisma.alertaCiudadana.findUnique({ where: { id }, include: INCLUYE });
  if (!alerta) throw AppError.noEncontrado('Alerta');
  return alerta;
}

export async function crear(datos: AlertaCreateInput) {
  const data = alertaCreateSchema.parse(datos);
  const local = await prisma.localEscolar.findUnique({
    where: { id: data.localEscolarId },
    select: { ieId: true },
  });
  if (!local) throw AppError.noEncontrado('Local escolar');
  if (local.ieId !== data.ieId) {
    throw AppError.badRequest('La institución educativa no corresponde al local escolar seleccionado');
  }
  return prisma.alertaCiudadana.create({
    data: { ...data, telefonoReporte: data.telefonoReporte || null },
    include: INCLUYE,
  });
}

/**
 * Actualiza estado, observacion y fecha de resolucion de una alerta.
 */
export async function cambiarEstado(id: number, datos: AlertaEstadoInput) {
  const data = alertaEstadoSchema.parse(datos);
  const existe = await prisma.alertaCiudadana.findUnique({ where: { id } });
  if (!existe) throw AppError.noEncontrado('Alerta');
  return prisma.alertaCiudadana.update({
    where: { id },
    data: {
      estado: data.estado,
      observacion: data.observacion ?? null,
      resueltoEn: data.estado === 'RESUELTA' ? new Date() : null,
    },
    include: INCLUYE,
  });
}

/**
 * Actualiza los datos del reporte manteniendo el estado de seguimiento actual.
 */
export async function actualizar(id: number, datos: AlertaCreateInput) {
  const data = alertaCreateSchema.parse(datos);
  const existe = await prisma.alertaCiudadana.findUnique({ where: { id } });
  if (!existe) throw AppError.noEncontrado('Alerta');
  const local = await prisma.localEscolar.findUnique({
    where: { id: data.localEscolarId },
    select: { ieId: true },
  });
  if (!local) throw AppError.noEncontrado('Local escolar');
  if (local.ieId !== data.ieId) {
    throw AppError.badRequest('La institución educativa no corresponde al local escolar seleccionado');
  }
  return prisma.alertaCiudadana.update({
    where: { id },
    data: { ...data, telefonoReporte: data.telefonoReporte || null },
    include: INCLUYE,
  });
}

export async function eliminar(id: number) {
  const existe = await prisma.alertaCiudadana.findUnique({ where: { id } });
  if (!existe) throw AppError.noEncontrado('Alerta');
  await prisma.alertaCiudadana.delete({ where: { id } });
  return { id, eliminado: true };
}

/** Conteo de alertas abiertas y en atencion, para el dashboard. */
export async function resumen() {
  const porEstado = await prisma.alertaCiudadana.groupBy({
    by: ['estado'],
    _count: { _all: true },
  });
  const porTipo = await prisma.alertaCiudadana.groupBy({
    by: ['tipo'],
    _count: { _all: true },
  });
  return { porEstado, porTipo };
}

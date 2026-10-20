import { Prisma } from '@prisma/client';

import { prisma } from '../../config/prisma.js';
import { AppError } from '../../common/errors.js';
import { paginar, ordenSeguro } from '../../common/paginacion.js';
import {
  alertaCreateSchema,
  alertaEstadoSchema,
  type AlertaCreateInput,
  type AlertaEstadoInput,
} from '@educa/shared';

const CAMPOS_ORDEN = ['createdAt', 'tipo', 'estado'] as const;

const INCLUYE = {
  localEscolar: { select: { id: true, codigoLocal: true, estado: true } },
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
          ],
        }
      : {}),
  };

  return paginar(
    prisma.alertaCiudadana,
    {
      where,
      include: INCLUYE,
      orderBy: ordenSeguro(filtros.sortBy, CAMPOS_ORDEN, 'createdAt'),
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
  return prisma.alertaCiudadana.create({
    data: { ...data, telefonoReporte: data.telefonoReporte || null },
    include: INCLUYE,
  });
}

/**
 * Cambia el estado de una alerta.
 *
 * Al pasar a RESUELTA se registra la fecha de resolucion.
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
      ...(data.estado === 'RESUELTA' ? { resueltoEn: new Date() } : {}),
    },
    include: INCLUYE,
  });
}

/**
 * Actualiza una alerta. Usa el mismo schema de alta porque una alerta solo
 * se modifica para corregir o ampliar su descripcion.
 */
export async function actualizar(id: number, datos: AlertaCreateInput) {
  const data = alertaCreateSchema.parse(datos);
  const existe = await prisma.alertaCiudadana.findUnique({ where: { id } });
  if (!existe) throw AppError.noEncontrado('Alerta');
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

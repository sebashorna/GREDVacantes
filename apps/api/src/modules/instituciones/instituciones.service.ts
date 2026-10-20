import { Prisma } from '@prisma/client';

import { prisma } from '../../config/prisma.js';
import { AppError } from '../../common/errors.js';
import { paginar, ordenSeguro } from '../../common/paginacion.js';
import {
  institucionCreateSchema,
  institucionFiltrosSchema,
  institucionUpdateSchema,
  type InstitucionCreateInput,
  type InstitucionFiltros,
  type InstitucionUpdateInput,
} from '@educa/shared';

const CAMPOS_ORDEN = ['nombre', 'codigoModular', 'nivel', 'createdAt'] as const;

const INCLUYE = {
  ugel: { select: { id: true, nombre: true, codigo: true } },
  provincia: { select: { id: true, nombre: true } },
  distrito: { select: { id: true, nombre: true } },
  _count: { select: { vacantes: true, plazas: true, locales: true } },
} as const;

/** Listado con filtros, busqueda y paginacion server-side. */
export async function listar(filtros: InstitucionFiltros) {
  const parsed = institucionFiltrosSchema.parse(filtros);

  const where: Prisma.InstitucionEducativaWhereInput = {
    ...(parsed.nivel ? { nivel: parsed.nivel } : {}),
    ...(parsed.turno ? { turno: parsed.turno } : {}),
    ...(parsed.zona ? { zona: parsed.zona } : {}),
    ...(parsed.ugelId ? { ugelId: parsed.ugelId } : {}),
    ...(parsed.provinciaId ? { provinciaId: parsed.provinciaId } : {}),
    ...(parsed.distritoId ? { distritoId: parsed.distritoId } : {}),
    ...(parsed.activo !== undefined ? { activo: parsed.activo } : {}),
    ...(parsed.search
      ? {
          OR: [
            { nombre: { contains: parsed.search, mode: 'insensitive' } },
            { codigoModular: { contains: parsed.search } },
          ],
        }
      : {}),
    ...(parsed.soloConVacantes
      ? { vacantes: { some: { estado: { in: ['LIBRE', 'LISTA_ESPERA'] } } } }
      : {}),
  };

  return paginar(
    prisma.institucionEducativa,
    { where, include: INCLUYE, orderBy: ordenSeguro(parsed.sortBy, CAMPOS_ORDEN, 'nombre') },
    { page: parsed.page, limit: parsed.limit },
  );
}

export async function obtenerPorId(id: number) {
  const institucion = await prisma.institucionEducativa.findUnique({
    where: { id },
    include: {
      ...INCLUYE,
      vacantes: { orderBy: { id: 'asc' } },
      plazas: {
        orderBy: { id: 'asc' },
        include: { ie: { select: { nombre: true, codigoModular: true } } },
      },
      locales: { orderBy: { id: 'asc' } },
    },
  });
  if (!institucion) throw AppError.noEncontrado('Institucion educativa');
  return institucion;
}

export async function crear(datos: InstitucionCreateInput) {
  const data = institucionCreateSchema.parse(datos);
  return prisma.institucionEducativa.create({
    data: { ...data, telefono: data.telefono || null, whatsapp: data.whatsapp || null },
    include: INCLUYE,
  });
}

export async function actualizar(id: number, datos: InstitucionUpdateInput) {
  const data = institucionUpdateSchema.parse(datos);
  const existe = await prisma.institucionEducativa.findUnique({ where: { id } });
  if (!existe) throw AppError.noEncontrado('Institucion educativa');
  return prisma.institucionEducativa.update({
    where: { id },
    data: {
      ...data,
      ...(data.telefono !== undefined ? { telefono: data.telefono || null } : {}),
      ...(data.whatsapp !== undefined ? { whatsapp: data.whatsapp || null } : {}),
    },
    include: INCLUYE,
  });
}

/**
 * Elimina la institucion.
 *
 * Se usa borrado logico (`activo = false`) para no perder los historiales
 * de vacantes, plazas y locales que la referencian.
 */
export async function eliminar(id: number) {
  const existe = await prisma.institucionEducativa.findUnique({ where: { id } });
  if (!existe) throw AppError.noEncontrado('Institucion educativa');
  return prisma.institucionEducativa.update({
    where: { id },
    data: { activo: false },
  });
}

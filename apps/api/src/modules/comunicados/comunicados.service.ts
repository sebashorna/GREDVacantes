import { Prisma } from '@prisma/client';

import { prisma } from '../../config/prisma.js';
import { AppError } from '../../common/errors.js';
import { paginar, ordenSeguroConDireccion } from '../../common/paginacion.js';
import {
  comunicadoCreateSchema,
  comunicadoUpdateSchema,
  type ComunicadoCreateInput,
  type ComunicadoUpdateInput,
} from '@educa/shared';

const CAMPOS_ORDEN = ['fecha', 'titulo', 'createdAt', 'updatedAt'] as const;

export interface FiltrosComunicados {
  page: number;
  limit: number;
  search?: string;
  categoria?: string;
  publicado?: boolean;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export async function listar(filtros: FiltrosComunicados) {
  const where: Prisma.ComunicadoWhereInput = {
    ...(filtros.categoria ? { categoria: filtros.categoria as never } : {}),
    ...(filtros.publicado !== undefined ? { publicado: filtros.publicado } : {}),
    ...(filtros.search
      ? {
          OR: [
            { titulo: { contains: filtros.search, mode: 'insensitive' } },
            { resumen: { contains: filtros.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  return paginar(
    prisma.comunicado,
    {
      where,
      orderBy: ordenSeguroConDireccion(
        filtros.sortBy,
        CAMPOS_ORDEN,
        'updatedAt',
        filtros.sortDir,
      ),
    },
    { page: filtros.page, limit: filtros.limit },
  );
}

export async function obtenerPorId(id: string) {
  const comunicado = await prisma.comunicado.findUnique({ where: { id } });
  if (!comunicado) throw AppError.noEncontrado('Comunicado');
  return comunicado;
}

export async function crear(datos: ComunicadoCreateInput) {
  const data = comunicadoCreateSchema.parse(datos);
  return prisma.comunicado.create({ data });
}

export async function actualizar(id: string, datos: ComunicadoUpdateInput) {
  const data = comunicadoUpdateSchema.parse(datos);
  const existe = await prisma.comunicado.findUnique({ where: { id } });
  if (!existe) throw AppError.noEncontrado('Comunicado');
  return prisma.comunicado.update({ where: { id }, data });
}

export async function eliminar(id: string) {
  const existe = await prisma.comunicado.findUnique({ where: { id } });
  if (!existe) throw AppError.noEncontrado('Comunicado');
  await prisma.comunicado.delete({ where: { id } });
  return { id, eliminado: true };
}

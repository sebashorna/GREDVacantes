import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { AppError } from './errors.js';
import { logger } from './logger.js';

interface ErrorBody {
  error: {
    codigo: string;
    mensaje: string;
    detalles?: unknown;
  };
}

/**
 * Manejador global de errores.
 *
 * - AppError      -> se respeta su status y su codigo
 * - ZodError      -> 422 con el detalle de campos
 * - Prisma known -> 409 para unicidad, 404 para no encontrado
 * - otros        -> 500 sin filtrar detalles internos al cliente
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response<ErrorBody>,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.status).json({
      error: { codigo: err.codigo, mensaje: err.message, ...(err.detalles ? { detalles: err.detalles } : {}) },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(422).json({
      error: {
        codigo: 'VALIDACION',
        mensaje: 'Los datos enviados no son validos',
        detalles: err.issues.map((i) => ({
          campo: i.path.join('.') || '(raiz)',
          mensaje: i.message,
        })),
      },
    });
    return;
  }

  // Errores de Prisma: se mapean sin exponer el driver.
  const prismaError = err as { code?: string; meta?: { target?: string[] } };
  if (typeof prismaError?.code === 'string' && prismaError.code.startsWith('P')) {
    if (prismaError.code === 'P2002') {
      const campos = prismaError.meta?.target?.join(', ') ?? 'campo';
      res.status(409).json({
        error: {
          codigo: 'CONFLICTO',
          mensaje: `Ya existe un registro con el mismo valor en: ${campos}`,
        },
      });
      return;
    }
    if (prismaError.code === 'P2025') {
      res.status(404).json({
        error: { codigo: 'NO_ENCONTRADO', mensaje: 'El registro solicitado no existe' },
      });
      return;
    }
    if (prismaError.code === 'P2003') {
      res.status(409).json({
        error: {
          codigo: 'CONFLICTO',
          mensaje: 'La operacion referencia registros relacionados que no existen o siguen en uso',
        },
      });
      return;
    }
  }

  logger.error('Error no controlado', {
    mensaje: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });

  res.status(500).json({
    error: { codigo: 'ERROR_INTERNO', mensaje: 'Ocurrio un error interno. Intente nuevamente.' },
  });
}

/** 404 para rutas no registradas. */
export function notFoundHandler(req: Request, res: Response<ErrorBody>): void {
  res.status(404).json({
    error: { codigo: 'RUTA_NO_ENCONTRADA', mensaje: `No existe el endpoint ${req.method} ${req.path}` },
  });
}

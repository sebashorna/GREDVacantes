import type { NextFunction, Request, Response } from 'express';

import { prisma } from '../config/prisma.js';
import { logger } from './logger.js';

interface opcionesAuditoria {
  accion: string;
  entidad: string;
  /** Resuelve el id de la entidad afectada a partir de la respuesta. */
  entidadId?: (res: Response) => string | undefined;
}

/**
 * Registra en la bitacora de auditoria toda operacion de escritura.
 *
 * La auditoria NUNCA debe romper la operacion principal: si falla el
 * INSERT, se registra el error pero la respuesta al cliente se mantiene.
 */
export function auditar(opts: opcionesAuditoria) {
  return (req: Request, res: Response, next: NextFunction): void => {
    res.on('finish', () => {
      // Solo interesan las escrituras exitosas.
      if (res.statusCode >= 400) return;

      void (async () => {
        try {
          const entidadId = opts.entidadId?.(res) ?? String(req.params.id ?? '');
          await prisma.auditoria.create({
            data: {
              usuarioId: req.usuario?.sub ?? null,
              accion: opts.accion,
              entidad: opts.entidad,
              entidadId: entidadId || undefined,
              detalle: req.method + ' ' + req.originalUrl,
              ip: req.ip ?? null,
              userAgent: (req.headers['user-agent'] ?? '').slice(0, 300) || null,
            },
          });
        } catch (error) {
          logger.error('No se pudo registrar la auditoria', {
            entidad: opts.entidad,
            accion: opts.accion,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      })();
    });

    next();
  };
}

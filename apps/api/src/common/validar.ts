import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny, z } from 'zod';

import { AppError } from './errors.js';

type Fuente = 'body' | 'query' | 'params';

/**
 * Middleware de validacion con Zod.
 *
 * Reemplaza el objeto original por el resultado parseado, de modo que los
 * controladores reciben datos ya coercionados y con tipos correctos.
 *
 * `req.query` es de solo lectura en Express 5; por eso el resultado se
 * guarda en `req.validatedQuery` y el controlador lo consume desde ahi.
 */
export function validar<T extends ZodTypeAny>(esquema: T, fuente: Fuente = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const entrada = req[fuente];
    const resultado = esquema.safeParse(entrada);

    if (!resultado.success) {
      next(
        AppError.badRequest(
          'Los datos enviados no son validos',
          resultado.error.issues.map((i) => ({
            campo: i.path.join('.') || '(raiz)',
            mensaje: i.message,
          })),
        ),
      );
      return;
    }

    if (fuente === 'query') {
      (req as Request & { validatedQuery?: unknown }).validatedQuery = resultado.data;
    } else {
      req[fuente] = resultado.data as never;
    }
    next();
  };
}

/** Lectura tipada de la query ya validada. */
export function queryValidada<T extends ZodTypeAny>(req: Request, _esquema: T): z.infer<T> {
  return (req as Request & { validatedQuery?: z.infer<T> }).validatedQuery as z.infer<T>;
}

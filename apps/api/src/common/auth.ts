import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { Rol } from '@prisma/client';

import { config } from '../config/env.js';
import { AppError } from './errors.js';

export interface PayloadToken {
  sub: number;
  email: string;
  nombre: string;
  rol: Rol;
  ugelId: number | null;
}

/** Claims del access token. */
export type AccessPayload = PayloadToken;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Presente cuando el request supero el guard de autenticacion. */
      usuario?: PayloadToken;
    }
  }
}

export function firmarAccessToken(payload: PayloadToken): string {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function firmarRefreshToken(payload: { sub: number }): string {
  return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
    expiresIn: config.REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verificarAccessToken(token: string): AccessPayload {
  try {
    const payload = jwt.verify(token, config.JWT_SECRET) as jwt.JwtPayload;
    return {
      sub: Number(payload.sub),
      email: String(payload.email),
      nombre: String(payload.nombre),
      rol: payload.rol as Rol,
      ugelId: payload.ugelId === null || payload.ugelId === undefined ? null : Number(payload.ugelId),
    };
  } catch {
    throw AppError.noAutorizado('Sesion expirada o token invalido');
  }
}

export function verificarRefreshToken(token: string): { sub: number } {
  try {
    const payload = jwt.verify(token, config.JWT_REFRESH_SECRET) as jwt.JwtPayload;
    return { sub: Number(payload.sub) };
  } catch {
    throw AppError.noAutorizado('Refresh token invalido o expirado');
  }
}

/**
 * Guard de autenticacion: exige un access token valido.
 *
 * Se apoya en `Authorization: Bearer <token>`.
 */
export function requiereAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(AppError.noAutorizado('Falta el encabezado Authorization'));
    return;
  }
  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    next(AppError.noAutorizado('Token vacio'));
    return;
  }
  req.usuario = verificarAccessToken(token);
  next();
}

/**
 * Guard de roles: exige uno de los roles indicados.
 *
 * Debe montarse DESPUES de `requiereAuth`.
 */
export function requiereRol(...roles: Rol[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.usuario) {
      next(AppError.noAutorizado());
      return;
    }
    if (!roles.includes(req.usuario.rol)) {
      next(AppError.prohibido(`Esta operacion requiere uno de estos roles: ${roles.join(', ')}`));
      return;
    }
    next();
  };
}

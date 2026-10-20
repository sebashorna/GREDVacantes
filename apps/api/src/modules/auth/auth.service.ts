import { createHash } from 'node:crypto';

import bcrypt from 'bcryptjs';

import { config } from '../../config/env.js';
import { prisma } from '../../config/prisma.js';
import {
  firmarAccessToken,
  firmarRefreshToken,
  verificarRefreshToken,
  type PayloadToken,
} from '../../common/auth.js';
import { AppError } from '../../common/errors.js';
import { logger } from '../../common/logger.js';
import { loginSchema, refreshSchema, type LoginInput, type RefreshInput } from '@educa/shared';

export interface SesionUsuario {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  usuario: {
    id: number;
    nombre: string;
    email: string;
    rol: PayloadToken['rol'];
    ugelId: number | null;
    ugel: { id: number; nombre: string } | null;
  };
}

/** Hash SHA-256 del refresh token: nunca se guarda el token en claro. */
function hashearToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function hashearPassword(password: string): Promise<string> {
  return bcrypt.hash(password, config.BCRYPT_ROUNDS);
}


/**
 * Inicia sesion.
 *
 * - Verifica credenciales.
 * - Emite un access token (corto) y un refresh token (largo, persistido hasheado).
 * - Revoca los refresh tokens previos del usuario (sesion unica por dispositivo).
 */
export async function login(datos: LoginInput): Promise<SesionUsuario> {
  const { email, password } = loginSchema.parse(datos);

  const usuario = await prisma.usuario.findUnique({
    where: { email },
    include: { ugel: { select: { id: true, nombre: true } } },
  });

  // Se responde siempre con el mismo mensaje para no revelar si el email existe.
  if (!usuario || !usuario.activo) {
    throw new AppError(401, 'CREDENCIALES_INVALIDAS', 'Correo o contrasena incorrectos');
  }

  const passwordOk = await verificarPassword(password, usuario.passwordHash);
  if (!passwordOk) {
    throw new AppError(401, 'CREDENCIALES_INVALIDAS', 'Correo o contrasena incorrectos');
  }

  await prisma.refreshToken.updateMany({
    where: { usuarioId: usuario.id, revocado: false },
    data: { revocado: true },
  });

  const payload: PayloadToken = {
    sub: usuario.id,
    email: usuario.email,
    nombre: usuario.nombre,
    rol: usuario.rol,
    ugelId: usuario.ugelId,
  };

  const accessToken = firmarAccessToken(payload);
  const refreshToken = firmarRefreshToken({ sub: usuario.id });

  await prisma.refreshToken.create({
    data: {
      usuarioId: usuario.id,
      tokenHash: hashearToken(refreshToken),
      expiraEn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { ultimoAcceso: new Date() },
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: config.JWT_EXPIRES_IN,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      ugelId: usuario.ugelId,
      ugel: usuario.ugel,
    },
  };
}

/**
 * Renueva el access token usando un refresh token valido.
 *
 * Rota el refresh token: el antiguo queda revocado. Asi, si un refresh token
 * es robado, el uso se detecta porque el token original deja de funcionar.
 */
export async function refrescar(datos: RefreshInput): Promise<SesionUsuario> {
  const { refreshToken } = refreshSchema.parse(datos);

  const { sub } = verificarRefreshToken(refreshToken);
  const tokenHash = hashearToken(refreshToken);

  const almacenado = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: {
      usuario: { include: { ugel: { select: { id: true, nombre: true } } } },
    },
  });

  if (!almacenado || almacenado.revocado || almacenado.expiraEn < new Date()) {
    throw AppError.noAutorizado('Refresh token invalido o expirado');
  }
  if (!almacenado.usuario.activo) {
    throw AppError.prohibido('El usuario esta desactivado');
  }

  await prisma.refreshToken.update({
    where: { id: almacenado.id },
    data: { revocado: true },
  });

  const payload: PayloadToken = {
    sub: almacenado.usuario.id,
    email: almacenado.usuario.email,
    nombre: almacenado.usuario.nombre,
    rol: almacenado.usuario.rol,
    ugelId: almacenado.usuario.ugelId,
  };

  const nuevoRefreshToken = firmarRefreshToken({ sub: almacenado.usuario.id });

  await prisma.refreshToken.create({
    data: {
      usuarioId: almacenado.usuario.id,
      tokenHash: hashearToken(nuevoRefreshToken),
      expiraEn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return {
    accessToken: firmarAccessToken(payload),
    refreshToken: nuevoRefreshToken,
    expiresIn: config.JWT_EXPIRES_IN,
    usuario: {
      id: almacenado.usuario.id,
      nombre: almacenado.usuario.nombre,
      email: almacenado.usuario.email,
      rol: almacenado.usuario.rol,
      ugelId: almacenado.usuario.ugelId,
      ugel: almacenado.usuario.ugel,
    },
  };
}

/** Cierra la sesion revocando el refresh token proporcionado. */
export async function logout(refreshToken: string): Promise<void> {
  try {
    await prisma.refreshToken.updateMany({
      where: { tokenHash: hashearToken(refreshToken) },
      data: { revocado: true },
    });
  } catch (error) {
    logger.warn('No se pudo revocar el refresh token en logout', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/** Devuelve el perfil del usuario autenticado. */
export async function perfil(usuarioId: number) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
      ugelId: true,
      activo: true,
      ultimoAcceso: true,
      ugel: { select: { id: true, nombre: true } },
    },
  });
  if (!usuario) throw AppError.noEncontrado('Usuario');
  return usuario;
}


export async function verificarPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

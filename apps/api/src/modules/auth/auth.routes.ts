import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import { loginSchema, refreshSchema } from '@educa/shared';

import { requiereAuth } from '../../common/auth.js';
import { validar } from '../../common/validar.js';
import * as service from './auth.service.js';

const router = Router();

/**
 * Limite de intentos por IP para los endpoints de credenciales.
 * 10 intentos en 15 minutos: suficiente para el uso legitimo yfrena la
 * fuerza bruta.
 */
const limitadorLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: {
      codigo: 'DEMASIADOS_INTENTOS',
      mensaje: 'Demasiados intentos de acceso. Intente nuevamente en 15 minutos.',
    },
  },
});

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Autenticacion]
 *     summary: Inicia sesion
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Sesion iniciada
 *       401:
 *         description: Credenciales invalidas
 */
router.post('/login', limitadorLogin, validar(loginSchema), async (req, res, next) => {
  try {
    const sesion = await service.login(req.body);
    res.json(sesion);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     tags: [Autenticacion]
 *     summary: Renueva el access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Token renovado
 *       401:
 *         description: Refresh token invalido
 */
router.post('/refresh', validar(refreshSchema), async (req, res, next) => {
  try {
    const sesion = await service.refrescar(req.body);
    res.json(sesion);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags: [Autenticacion]
 *     summary: Cierra la sesion revocando el refresh token
 *     responses:
 *       200:
 *         description: Sesion cerrada
 */
router.post('/logout', validar(refreshSchema), async (req, res, next) => {
  try {
    await service.logout(req.body.refreshToken);
    res.json({ mensaje: 'Sesion cerrada correctamente' });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/auth/perfil:
 *   get:
 *     tags: [Autenticacion]
 *     summary: Perfil del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *       401:
 *         description: No autenticado
 */
router.get('/perfil', requiereAuth, async (req, res, next) => {
  try {
    const usuario = await service.perfil(req.usuario!.sub);
    res.json(usuario);
  } catch (error) {
    next(error);
  }
});

export default router;

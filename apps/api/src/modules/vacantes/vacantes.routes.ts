import { Router } from 'express';

import { requiereAuth, requiereRol } from '../../common/auth.js';
import { auditar } from '../../common/auditoria.js';
import { validar, queryValidada } from '../../common/validar.js';
import { paginacionQuerySchema, vacanteCreateSchema, vacanteUpdateSchema } from '@educa/shared';

import * as service from './vacantes.service.js';

const router = Router();

router.use(requiereAuth);

/**
 * @openapi
 * /api/vacantes:
 *   get:
 *     tags: [Vacantes]
 *     summary: Lista paginada de vacantes de matricula
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vacantes paginadas
 */
router.get('/', validar(paginacionQuerySchema, 'query'), async (req, res, next) => {
  try {
    const query = queryValidada(req, paginacionQuerySchema);
    const resultado = await service.listar({
      ...query,
      nivel: req.query.nivel as never,
      turno: req.query.turno as never,
      estado: req.query.estado as never,
      ugelId: req.query.ugelId ? Number(req.query.ugelId) : undefined,
      ieId: req.query.ieId ? Number(req.query.ieId) : undefined,
    });
    res.json(resultado);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/vacantes/resumen:
 *   get:
 *     tags: [Vacantes]
 *     summary: Resumen de cupos por nivel y estado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resumen de cupos
 */
router.get('/resumen', async (_req, res, next) => {
  try {
    const data = await service.resumenCupos();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/vacantes/{id}:
 *   get:
 *     tags: [Vacantes]
 *     summary: Detalle de una vacante
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Detalle de la vacante
 */
router.get('/:id', async (req, res, next) => {
  try {
    const data = await service.obtenerPorId(Number(req.params.id));
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/vacantes:
 *   post:
 *     tags: [Vacantes]
 *     summary: Crea una vacante
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Vacante creada
 */
router.post(
  '/',
  requiereRol('ADMIN_GRED', 'EDITOR_UGEL'),
  validar(vacanteCreateSchema),
  auditar({ accion: 'CREAR', entidad: 'vacante' }),
  async (req, res, next) => {
    try {
      const data = await service.crear(req.body);
      res.status(201).json(data);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @openapi
 * /api/vacantes/{id}:
 *   put:
 *     tags: [Vacantes]
 *     summary: Actualiza una vacante
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vacante actualizada
 */
router.put(
  '/:id',
  requiereRol('ADMIN_GRED', 'EDITOR_UGEL'),
  validar(vacanteUpdateSchema),
  auditar({ accion: 'ACTUALIZAR', entidad: 'vacante' }),
  async (req, res, next) => {
    try {
      const data = await service.actualizar(Number(req.params.id), req.body);
      res.json(data);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @openapi
 * /api/vacantes/{id}:
 *   delete:
 *     tags: [Vacantes]
 *     summary: Elimina una vacante
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vacante eliminada
 */
router.delete(
  '/:id',
  requiereRol('ADMIN_GRED', 'EDITOR_UGEL'),
  auditar({ accion: 'ELIMINAR', entidad: 'vacante' }),
  async (req, res, next) => {
    try {
      const data = await service.eliminar(Number(req.params.id));
      res.json(data);
    } catch (error) {
      next(error);
    }
  },
);

export default router;

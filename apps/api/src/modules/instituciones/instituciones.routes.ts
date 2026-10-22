import { Router } from 'express';

import { requiereAuth, requiereRol } from '../../common/auth.js';
import { auditar } from '../../common/auditoria.js';
import { validar, queryValidada } from '../../common/validar.js';
import {
  institucionCreateSchema,
  institucionFiltrosSchema,
  institucionUpdateSchema,
} from '@educa/shared';

import * as service from './instituciones.service.js';

const router = Router();

router.use(requiereAuth);

/**
 * @openapi
 * /api/instituciones:
 *   get:
 *     tags: [Instituciones]
 *     summary: Lista paginada de instituciones educativas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 20 } }
 *       - { in: query, name: search, schema: { type: string } }
 *       - { in: query, name: nivel, schema: { type: string } }
 *       - { in: query, name: ugelId, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Instituciones paginadas
 */
router.get('/', validar(institucionFiltrosSchema, 'query'), async (req, res, next) => {
  try {
    const filtros = queryValidada(req, institucionFiltrosSchema);
    const resultado = await service.listar(filtros);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/instituciones/{id}:
 *   get:
 *     tags: [Instituciones]
 *     summary: Detalle de una institucion con vacantes, plazas y locales
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Detalle de la institucion
 *       404:
 *         description: No encontrada
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
 * /api/instituciones:
 *   post:
 *     tags: [Instituciones]
 *     summary: Crea una institucion educativa
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Institucion creada
 *       409:
 *         description: Codigo modular duplicado
 */
router.post(
  '/',
  requiereRol('ADMIN_GRED', 'EDITOR_UGEL'),
  validar(institucionCreateSchema),
  auditar({ accion: 'CREAR', entidad: 'institucion' }),
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
 * /api/instituciones/{id}:
 *   put:
 *     tags: [Instituciones]
 *     summary: Actualiza una institucion educativa
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Institucion actualizada
 */
router.put(
  '/:id',
  requiereRol('ADMIN_GRED'),
  validar(institucionUpdateSchema),
  auditar({ accion: 'ACTUALIZAR', entidad: 'institucion' }),
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
 * /api/instituciones/{id}:
 *   delete:
 *     tags: [Instituciones]
 *     summary: Desactiva (borrado logico) una institucion
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Institucion desactivada
 */
router.delete(
  '/:id',
  requiereRol('ADMIN_GRED'),
  auditar({ accion: 'ELIMINAR', entidad: 'institucion' }),
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

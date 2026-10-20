import { Router } from 'express';

import { crudRouter } from '../../common/crud-router.js';
import { requiereRol } from '../../common/auth.js';
import { auditar } from '../../common/auditoria.js';
import { validar } from '../../common/validar.js';
import { alertaCreateSchema, alertaEstadoSchema } from '@educa/shared';

import * as service from './alertas.service.js';
import type { FiltrosAlertas } from './alertas.service.js';

const router = crudRouter<
  Parameters<typeof service.crear>[0],
  Parameters<typeof service.actualizar>[1],
  FiltrosAlertas
>({
  entidad: 'alerta',
  schemaCrear: alertaCreateSchema,
  schemaActualizar: alertaCreateSchema,
  servicio: service,
  rolesEscritura: ['ADMIN_GRED', 'EDITOR_UGEL'],
  filtrosListado: (req) => {
    const q = req.query as Record<string, string | undefined>;
    return {
      page: Number(q.page ?? 1),
      limit: Number(q.limit ?? 20),
      search: q.search,
      estado: q.estado,
      tipo: q.tipo,
      ieId: q.ieId ? Number(q.ieId) : undefined,
      localEscolarId: q.localEscolarId ? Number(q.localEscolarId) : undefined,
      sortBy: q.sortBy,
      sortDir: q.sortDir as 'asc' | 'desc' | undefined,
    };
  },
});

/**
 * @openapi
 * /api/alertas/{id}/estado:
 *   patch:
 *     tags: [Alertas]
 *     summary: Cambia el estado de una alerta
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Alerta actualizada
 */
router.patch(
  '/:id/estado',
  requiereRol('ADMIN_GRED', 'EDITOR_UGEL'),
  validar(alertaEstadoSchema),
  auditar({ accion: 'CAMBIAR_ESTADO', entidad: 'alerta' }),
  async (req, res, next) => {
    try {
      const data = await service.cambiarEstado(Number(req.params.id), req.body);
      res.json(data);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @openapi
 * /api/alertas:
 *   get:
 *     tags: [Alertas]
 *     summary: Lista paginada de alertas ciudadanas
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Alertas paginadas
 */
export default router;

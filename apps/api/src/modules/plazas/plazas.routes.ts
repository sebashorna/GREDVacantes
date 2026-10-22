import { Router } from 'express';

import { crudRouter } from '../../common/crud-router.js';
import { plazaCreateSchema, plazaUpdateSchema } from '@educa/shared';

import * as service from './plazas.service.js';
import type { FiltrosPlazas } from './plazas.service.js';

const router = crudRouter<
  Parameters<typeof service.crear>[0],
  Parameters<typeof service.actualizar>[1],
  FiltrosPlazas
>({
  entidad: 'plaza',
  schemaCrear: plazaCreateSchema,
  schemaActualizar: plazaUpdateSchema,
  servicio: service,
  rolesCrear: ['ADMIN_GRED', 'EDITOR_UGEL'],
  rolesActualizar: ['ADMIN_GRED'],
  rolesEliminar: ['ADMIN_GRED'],
  filtrosListado: (req) => {
    const q = req.query as Record<string, string | undefined>;
    return {
      page: Number(q.page ?? 1),
      limit: Number(q.limit ?? 20),
      search: q.search,
      ieId: q.ieId ? Number(q.ieId) : undefined,
      convocatoriaId: q.convocatoriaId ? Number(q.convocatoriaId) : undefined,
      ugelId: q.ugelId ? Number(q.ugelId) : undefined,
      tipo: q.tipo,
      nivel: q.nivel,
      estado: q.estado,
      sortBy: q.sortBy,
      sortDir: q.sortDir as 'asc' | 'desc' | undefined,
    };
  },
});

/**
 * @openapi
 * /api/plazas:
 *   get:
 *     tags: [Plazas]
 *     summary: Lista paginada de plazas docentes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Plazas paginadas
 */
export default router;

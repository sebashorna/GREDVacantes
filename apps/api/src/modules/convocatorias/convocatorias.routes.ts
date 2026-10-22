import { Router } from 'express';

import { crudRouter } from '../../common/crud-router.js';
import type { FiltrosConvocatorias } from './convocatorias.service.js';
import {
  convocatoriaCreateSchema,
  convocatoriaUpdateSchema,
} from '@educa/shared';

import * as service from './convocatorias.service.js';

const router = crudRouter<
  Parameters<typeof service.crear>[0],
  Parameters<typeof service.actualizar>[1],
  FiltrosConvocatorias
>({
  entidad: 'convocatoria',
  schemaCrear: convocatoriaCreateSchema,
  schemaActualizar: convocatoriaUpdateSchema,
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
      fase: q.fase,
      activo: q.activo === undefined ? undefined : q.activo === 'true',
      sortBy: q.sortBy,
      sortDir: q.sortDir as 'asc' | 'desc' | undefined,
    };
  },
});

/**
 * @openapi
 * /api/convocatorias:
 *   get:
 *     tags: [Convocatorias]
 *     summary: Lista paginada de convocatorias
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Convocatorias paginadas
 */
export default router;

import { Router } from 'express';

import { crudRouter } from '../../common/crud-router.js';
import { comunicadoCreateSchema, comunicadoUpdateSchema } from '@educa/shared';

import * as service from './comunicados.service.js';
import type { FiltrosComunicados } from './comunicados.service.js';

const router = crudRouter<
  Parameters<typeof service.crear>[0],
  Parameters<typeof service.actualizar>[1],
  FiltrosComunicados,
  string
>({
  entidad: 'comunicado',
  schemaCrear: comunicadoCreateSchema,
  schemaActualizar: comunicadoUpdateSchema,
  servicio: service,
  rolesEscritura: ['ADMIN_GRED', 'EDITOR_UGEL'],
  filtrosListado: (req) => {
    const q = req.query as Record<string, string | undefined>;
    return {
      page: Number(q.page ?? 1),
      limit: Number(q.limit ?? 20),
      search: q.search,
      categoria: q.categoria,
      publicado: q.publicado === undefined ? undefined : q.publicado === 'true',
      sortBy: q.sortBy,
      sortDir: q.sortDir as 'asc' | 'desc' | undefined,
    };
  },
});

/**
 * @openapi
 * /api/comunicados:
 *   get:
 *     tags: [Comunicados]
 *     summary: Lista paginada de comunicados
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Comunicados paginados
 */
export default router;

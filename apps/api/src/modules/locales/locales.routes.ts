import { Router } from 'express';

import { crudRouter } from '../../common/crud-router.js';
import { localCreateSchema, localUpdateSchema } from '@educa/shared';

import * as service from './locales.service.js';
import type { FiltrosLocales } from './locales.service.js';

const router = crudRouter<
  Parameters<typeof service.crear>[0],
  Parameters<typeof service.actualizar>[1],
  FiltrosLocales
>({
  entidad: 'local',
  schemaCrear: localCreateSchema,
  schemaActualizar: localUpdateSchema,
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
      estado: q.estado,
      ugelId: q.ugelId ? Number(q.ugelId) : undefined,
      provinciaId: q.provinciaId ? Number(q.provinciaId) : undefined,
      ieId: q.ieId ? Number(q.ieId) : undefined,
      prioritario: q.prioritario === 'true' ? true : undefined,
      sortBy: q.sortBy,
      sortDir: q.sortDir as 'asc' | 'desc' | undefined,
    };
  },
});

/**
 * @openapi
 * /api/locales:
 *   get:
 *     tags: [Infraestructura]
 *     summary: Lista paginada de locales escolares
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Locales paginados
 */
export default router;

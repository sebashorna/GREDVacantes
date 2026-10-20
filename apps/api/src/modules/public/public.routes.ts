import { Router } from 'express';

import { prisma } from '../../config/prisma.js';

const router = Router();

/**
 * Endpoints publicos (sin autenticacion).
 *
 * Estan pensados para el portal web de cara a la Ciudadania. Solo exponen
 * datos ya publicados: comunicados marcados como publicados y el conteo
 * de vacantes libres. No exponen datos sensibles ni permiten escrituras.
 */

/**
 * @openapi
 * /api/public/comunicados:
 *   get:
 *     tags: [Publico]
 *     summary: Comunicados publicados (portal web)
 *     parameters:
 *       - { in: query, name: limite, schema: { type: integer, default: 20 } }
 *     responses:
 *       200:
 *         description: Comunicados publicados
 */
router.get('/comunicados', async (req, res, next) => {
  try {
    const limite = Math.min(Number(req.query.limite ?? 20) || 20, 100);
    const data = await prisma.comunicado.findMany({
      where: { publicado: true },
      orderBy: { fecha: 'desc' },
      take: limite,
      select: {
        id: true,
        titulo: true,
        categoria: true,
        resumen: true,
        contenido: true,
        fecha: true,
        imagenUrl: true,
      },
    });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/public/vacantes:
 *   get:
 *     tags: [Publico]
 *     summary: Conteo de vacantes libres por nivel (portal web)
 *     responses:
 *       200:
 *         description: Conteo de cupos disponibles por nivel
 */
router.get('/vacantes', async (_req, res, next) => {
  try {
    const porNivel = await prisma.vacanteMatricula.groupBy({
      by: ['nivel'],
      where: { estado: { in: ['LIBRE', 'LISTA_ESPERA'] } },
      _sum: { cupoDisponibles: true },
    });
    const total = porNivel.reduce((suma, fila) => suma + (fila._sum.cupoDisponibles ?? 0), 0);
    res.json({ totalCuposDisponibles: total, porNivel });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/public/convocatorias:
 *   get:
 *     tags: [Publico]
 *     summary: Convocatorias activas (portal web)
 *     responses:
 *       200:
 *         description: Convocatorias vigentes
 */
router.get('/convocatorias', async (_req, res, next) => {
  try {
    const data = await prisma.convocatoria.findMany({
      where: { activo: true, fase: { not: 'FINALIZADA' } },
      orderBy: { fechaInicio: 'desc' },
      select: {
        id: true,
        titulo: true,
        numeroRD: true,
        descripcion: true,
        fechaInicio: true,
        fechaFin: true,
        fase: true,
        pdfMeritosUrl: true,
      },
    });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;

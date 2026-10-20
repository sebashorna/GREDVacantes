import { prisma } from '../../config/prisma.js';
import { requiereAuth } from '../../common/auth.js';
import { Router } from 'express';

const router = Router();

/**
 * @openapi
 * /api/dashboard:
 *   get:
 *     tags: [Dashboard]
 *     summary: Indicadores resumen del panel (pantalla de inicio)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Indicadores agregados
 */
router.get('/', requiereAuth, async (_req, res, next) => {
  try {
    const [
      totalIes,
      totalVacantes,
      totalPlazas,
      totalLocales,
      alertasAbiertas,
      avisosRecientes,
    ] = await Promise.all([
      prisma.institucionEducativa.count({ where: { activo: true } }),
      prisma.vacanteMatricula.count(),
      prisma.plazaDocente.count(),
      prisma.localEscolar.count(),
      prisma.alertaCiudadana.count({ where: { estado: { in: ['ABIERTA', 'EN_ATENCION'] } } }),
      prisma.comunicado.count({ where: { publicado: true } }),
    ]);

    const [cuposPorNivel, plazasPorTipo, localesPorEstado, alertasPorEstado] = await Promise.all([
      prisma.vacanteMatricula.groupBy({
        by: ['nivel'],
        _sum: { cupoTotal: true, cupoDisponibles: true },
      }),
      prisma.plazaDocente.groupBy({ by: ['tipo'], _sum: { cantidad: true } }),
      prisma.localEscolar.groupBy({ by: ['estado'], _count: { _all: true } }),
      prisma.alertaCiudadana.groupBy({ by: ['estado'], _count: { _all: true } }),
    ]);

    res.json({
      totales: {
        instituciones: totalIes,
        vacantes: totalVacantes,
        plazas: totalPlazas,
        locales: totalLocales,
        alertasAbiertas,
        comunicadosPublicados: avisosRecientes,
      },
      cuposPorNivel,
      plazasPorTipo,
      localesPorEstado,
      alertasPorEstado,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

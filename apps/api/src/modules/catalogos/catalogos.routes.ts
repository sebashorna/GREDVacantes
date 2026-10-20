import { Router } from 'express';

import { prisma } from '../../config/prisma.js';
import { requiereAuth } from '../../common/auth.js';

const router = Router();

/**
 * Catalogos de apoyo para los formularios del panel.
 *
 * Son de solo lectura y exigen autenticacion porque el panel siempre opera
 * con sesion iniciada.
 */

/**
 * @openapi
 * /api/catalogos/ugeles:
 *   get:
 *     tags: [Catalogos]
 *     summary: Lista de UGEL
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: UGEL disponibles
 */
router.get('/ugeles', requiereAuth, async (_req, res, next) => {
  try {
    const data = await prisma.ugel.findMany({
      orderBy: { nombre: 'asc' },
      select: { id: true, codigo: true, nombre: true },
    });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/catalogos/provincias:
 *   get:
 *     tags: [Catalogos]
 *     summary: Lista de provincias
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Provincias disponibles
 */
router.get('/provincias', requiereAuth, async (_req, res, next) => {
  try {
    const data = await prisma.provincia.findMany({
      orderBy: { nombre: 'asc' },
      select: { id: true, codigo: true, nombre: true },
    });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/catalogos/distritos:
 *   get:
 *     tags: [Catalogos]
 *     summary: Lista de distritos, filtrable por provincia
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: provinciaId
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Distritos disponibles
 */
router.get('/distritos', requiereAuth, async (req, res, next) => {
  try {
    const provinciaId = req.query.provinciaId ? Number(req.query.provinciaId) : undefined;
    const data = await prisma.distrito.findMany({
      where: provinciaId ? { provinciaId } : undefined,
      orderBy: { nombre: 'asc' },
      select: { id: true, codigo: true, nombre: true, provinciaId: true },
    });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/catalogos/enums:
 *   get:
 *     tags: [Catalogos]
 *     summary: Enums del dominio con sus etiquetas legibles
 *     responses:
 *       200:
 *         description: Enums y etiquetas
 */
router.get('/enums', async (_req, res, next) => {
  try {
    const enums = await import('@educa/shared');
    res.json({
      niveles: enums.NIVELES,
      turnos: enums.TURNOS,
      zonas: enums.ZONAS,
      jornadas: enums.JORNADAS,
      estadosVacante: enums.ESTADOS_VACANTE,
      tiposPlaza: enums.TIPOS_PLAZA,
      estadosPlaza: enums.ESTADOS_PLAZA,
      fasesConvocatoria: enums.FASES_CONVOCATORIA,
      estadosLocal: enums.ESTADOS_LOCAL,
      estadosServicio: enums.ESTADOS_SERVICIO,
      estadosAlerta: enums.ESTADOS_ALERTA,
      tiposAlerta: enums.TIPOS_ALERTA,
      categoriasComunicado: enums.CATEGORIAS_COMUNICADO,
      roles: enums.ROLES,
      etiquetas: {
        nivel: enums.ETIQUETAS_NIVEL,
        turno: enums.ETIQUETAS_TURNO,
        zona: enums.ETIQUETAS_ZONA,
        jornada: enums.ETIQUETAS_JORNADA,
        estadoVacante: enums.ETIQUETAS_ESTADO_VACANTE,
        tipoPlaza: enums.ETIQUETAS_TIPO_PLAZA,
        estadoPlaza: enums.ETIQUETAS_ESTADO_PLAZA,
        estadoLocal: enums.ETIQUETAS_ESTADO_LOCAL,
        estadoAlerta: enums.ETIQUETAS_ESTADO_ALERTA,
        rol: enums.ETIQUETAS_ROL,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

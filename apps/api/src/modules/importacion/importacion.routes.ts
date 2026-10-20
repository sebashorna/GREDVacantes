import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import { requiereAuth, requiereRol } from '../../common/auth.js';
import { auditar } from '../../common/auditoria.js';
import { AppError } from '../../common/errors.js';
import { logger } from '../../common/logger.js';
import { TIPO_IMPORTACION } from '@educa/shared';

import { parsearCSV } from './csv.js';
import * as service from './importacion.service.js';
import type { TipoImportacion } from './importacion.schema.js';
const router = Router();

/** Limite de 5 importaciones por hora y por IP: las importaciones son pesadas. */
const limitador = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: {
      codigo: 'DEMASIADAS_IMPORTACIONES',
      mensaje: 'Limite de importaciones alcanzado. Intente nuevamente mas tarde.',
    },
  },
});

/** Encabezados de cada plantilla, alineados con los schemas de importacion. */
const PLANTILLAS: Record<TipoImportacion, string[]> = {
  INSTITUCIONES: [
    'codigoModular',
    'nombre',
    'nivel',
    'turno',
    'zona',
    'ugelCodigo',
    'provinciaCodigo',
    'distritoCodigo',
    'telefono',
    'whatsapp',
  ],
  LOCALES: [
    'codigoLocal',
    'codigoModular',
    'estado',
    'aulasOperativas',
    'aulasTotales',
    'agua',
    'luz',
    'fibra',
    'capacidadAlumnos',
  ],
  PLAZAS: [
    'codigoModular',
    'numeroRD',
    'cargo',
    'area',
    'nivel',
    'jornada',
    'zona',
    'turno',
    'tipo',
    'cantidad',
  ],
};

router.use(requiereAuth);

function escapar(valor: string): string {
  if (/[",\n]/.test(valor)) return `"${valor.replace(/"/g, '""')}"`;
  return valor;
}


/**
 * @openapi
 * /api/importacion/plantilla/{tipo}:
 *   get:
 *     tags: [Importacion]
 *     summary: Descarga la plantilla CSV del tipo indicado
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: tipo, required: true, schema: { type: string, enum: [INSTITUCIONES, LOCALES, PLAZAS] } }
 *     responses:
 *       200:
 *         description: Archivo CSV con la plantilla
 */
router.get('/plantilla/:tipo', (req, res, next) => {
  try {
    // Se acepta el tipo en cualquier caso (el usuario puede escribir
    // "instituciones" o "INSTITUCIONES").
    const tipo = String(req.params.tipo ?? '').toUpperCase() as TipoImportacion;
    const columnas = PLANTILLAS[tipo];
    if (!columnas) {
      throw AppError.badRequest(
        `Tipo no soportado. Use uno de: ${TIPO_IMPORTACION.join(', ')}`,
      );
    }
    // Se incluye una fila de ejemplo para que el usuario vea el formato.
    const ejemplo: Record<TipoImportacion, Record<string, string>> = {
      INSTITUCIONES: {
        codigoModular: '1580001',
        nombre: 'I.E. Pedro Ruiz Gallo',
        nivel: 'PRIMARIA',
        turno: 'MANANA',
        zona: 'URBANA',
        ugelCodigo: 'UGEL-LAM-01',
        provinciaCodigo: 'LAM-01',
        distritoCodigo: 'LAM-01-01',
        telefono: '051-0000000',
        whatsapp: '51900000000',
      },
      LOCALES: {
        codigoLocal: '1580001',
        codigoModular: '1580001',
        estado: 'OPTIMO',
        aulasOperativas: '8',
        aulasTotales: '10',
        agua: 'AGUA_24H',
        luz: 'SI',
        fibra: 'NO',
        capacidadAlumnos: '300',
      },
      PLAZAS: {
        codigoModular: '1580001',
        numeroRD: 'R.D. Nº 00412-2025',
        cargo: 'DOCENTE',
        area: 'MATEMATICA',
        nivel: 'PRIMARIA',
        jornada: 'JORNADA_30',
        zona: 'URBANA',
        turno: 'MANANA',
        tipo: 'ORGANICA',
        cantidad: '1',
      },
    };

    const contenido = [
      columnas.join(','),
      columnas.map((c) => escapar(ejemplo[tipo][c] ?? '')).join(','),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="plantilla-${tipo.toLowerCase()}.csv"`,
    );
    res.send(`\uFEFF${contenido}`); // BOM para que Excel reconozca UTF-8.
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/importacion:
 *   post:
 *     tags: [Importacion]
 *     summary: Importa masivamente instituciones, locales o plazas desde un CSV
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [tipo, archivo]
 *             properties:
 *               tipo: { type: string, enum: [INSTITUCIONES, LOCALES, PLAZAS] }
 *               archivo: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Resumen de la importacion
 */
router.post(
  '/',
  limitador,
  requiereRol('ADMIN_GRED'),
  auditar({ accion: 'IMPORTAR', entidad: 'importacion' }),
  async (req, res, next) => {
    try {
      const tipo = String(req.body?.tipo ?? '').toUpperCase() as TipoImportacion;
      if (!TIPO_IMPORTACION.includes(tipo)) {
        throw AppError.badRequest(
          `Tipo de importacion invalido. Use uno de: ${TIPO_IMPORTACION.join(', ')}`,
        );
      }

      const archivo = (req.files as { archivo?: { buffer: Buffer; originalname: string }[] } | undefined)
        ?.archivo?.[0];

      if (!archivo) {
        throw AppError.badRequest('No se recibio el archivo. Envie el CSV en el campo "archivo"');
      }
      if (!archivo.originalname.toLowerCase().endsWith('.csv')) {
        throw AppError.badRequest('Solo se aceptan archivos CSV');
      }
      // 10 MB es holgado para el volumen de IEs de una region.
      if (archivo.buffer.length > 10 * 1024 * 1024) {
        throw AppError.badRequest('El archivo supera el maximo de 10 MB');
      }

      const contenido = archivo.buffer.toString('utf-8');
      let filas: Record<string, unknown>[];
      try {
        filas = parsearCSV(contenido) as Record<string, unknown>[];
      } catch (error) {
        throw AppError.badRequest(
          `No se pudo leer el archivo CSV: ${error instanceof Error ? error.message : 'formato invalido'}`,
        );
      }

      const resumen = await service.importar(tipo, filas);
      logger.info('Importacion completada', {
        tipo,
        total: resumen.total,
        errores: resumen.errores,
      });
      res.json(resumen);
    } catch (error) {
      next(error);
    }
  },
);

export default router;


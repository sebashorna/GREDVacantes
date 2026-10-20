import { z } from 'zod';

import {
  ESTADOS_LOCAL,
  ESTADOS_SERVICIO,
  JORNADAS,
  NIVELES,
  TIPOS_PLAZA,
  TURNOS,
  ZONAS,
} from '@educa/shared';

/**
 * Formato de la plantilla de importacion masiva (CSV/Excel).
 *
 * La plantilla se exporta desde el panel con los mismos encabezados que
 * espera el importador, de modo que el usuario puede editar y volver a
 * subirla sin transformaciones intermedias.
 */

/** Fila de la plantilla de instituciones educativas. */
export const filaInstitucionSchema = z.object({
  codigoModular: z.string().trim().min(6).max(7),
  nombre: z.string().trim().min(3).max(200),
  nivel: z.enum(NIVELES),
  turno: z.enum(TURNOS),
  zona: z.enum(ZONAS),
  ugelCodigo: z.string().trim().min(1).max(20),
  provinciaCodigo: z.string().trim().min(1).max(20),
  distritoCodigo: z.string().trim().min(1).max(20),
  telefono: z.string().trim().optional(),
  whatsapp: z.string().trim().optional(),
});

/** Fila de la plantilla de locales escolares. */
export const filaLocalSchema = z.object({
  codigoLocal: z.string().trim().min(5).max(8),
  codigoModular: z.string().trim().min(6).max(7),
  estado: z.enum(ESTADOS_LOCAL),
  aulasOperativas: z.coerce.number().int().min(0).max(500),
  aulasTotales: z.coerce.number().int().min(0).max(500),
  agua: z.enum(ESTADOS_SERVICIO),
  luz: z.enum(['SI', 'NO']).transform((v) => v === 'SI'),
  fibra: z.enum(['SI', 'NO']).transform((v) => v === 'SI'),
  capacidadAlumnos: z.coerce.number().int().min(0).max(10000).optional(),
});

/** Fila de la plantilla de plazas docentes. */
export const filaPlazaSchema = z.object({
  codigoModular: z.string().trim().min(6).max(7),
  numeroRD: z.string().trim().min(1).max(50),
  cargo: z.string().trim().min(3).max(150),
  area: z.string().trim().min(2).max(150),
  nivel: z.enum(NIVELES),
  jornada: z.enum(JORNADAS),
  zona: z.enum(ZONAS),
  turno: z.enum(TURNOS),
  tipo: z.enum(TIPOS_PLAZA),
  cantidad: z.coerce.number().int().min(1).max(500),
});

export const TIPO_IMPORTACION = ['INSTITUCIONES', 'LOCALES', 'PLAZAS'] as const;
export type TipoImportacion = (typeof TIPO_IMPORTACION)[number];
/** Resultado de una fila procesada. */
export interface ResultadoFila {
  fila: number;
  estado: 'IMPORTADA' | 'ACTUALIZADA' | 'ERROR';
  mensaje?: string;
  codigo?: string;
}

/** Resumen de una importacion completa. */
export interface ResumenImportacion {
  tipo: TipoImportacion;
  total: number;
  importadas: number;
  actualizadas: number;
  errores: number;
  detalle: ResultadoFila[];
}

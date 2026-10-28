import { z } from 'zod';

import {
  CATEGORIAS_COMUNICADO,
  ESTADOS_ALERTA,
  ESTADOS_LOCAL,
  ESTADOS_PLAZA,
  ESTADOS_SERVICIO,
  ESTADOS_VACANTE,
  FASES_CONVOCATORIA,
  JORNADAS,
  NIVELES,
  ROLES,
  TIPOS_ALERTA,
  TIPOS_PLAZA,
  TURNOS,
  ZONAS,
} from './enums.js';

/* ------------------------------------------------------------------ */
/* Primitivas                                                         */
/* ------------------------------------------------------------------ */

export const TIPO_IMPORTACION = ['INSTITUCIONES', 'LOCALES', 'PLAZAS'] as const;
export type TipoImportacion = (typeof TIPO_IMPORTACION)[number];

/**
 * Codigo modular educativo.
 *
 * Nota: los codigos modulares reales del MINEDU tienen 7 digitos. Los datos
 * del mockup usan 7 digitos tambien, pero son ficticios: la validacion
 * comprueba FORMATO y unicidad, nunca coincidencia contra un padron real
 * (la BD oficial aun no esta confirmada).
 */
export const codigoModularSchema = z
  .string()
  .trim()
  .min(6, 'El codigo modular debe tener al menos 6 digitos')
  .max(7, 'El codigo modular debe tener como maximo 7 digitos')
  .regex(/^\d+$/, 'El codigo modular solo admite digitos');

/** Codigo local escolar (numero de local, 6 digitos segun ESCALE). */
export const codigoLocalSchema = z
  .string()
  .trim()
  .min(5, 'El codigo de local debe tener al menos 5 digitos')
  .max(8, 'El codigo de local debe tener como maximo 8 digitos')
  .regex(/^\d+$/, 'El codigo de local solo admite digitos');

export const telefonoSchema = z
  .string()
  .trim()
  .min(6, 'Telefono demasiado corto')
  .max(20, 'Telefono demasiado largo')
  .regex(/^[\d\s()+-]+$/, 'Formato de telefono invalido');

/** WhatsApp: solo digitos, con codigo de pais opcional (51). */
export const whatsappSchema = z
  .string()
  .trim()
  .min(9, 'Numero de WhatsApp demasiado corto')
  .max(15, 'Numero de WhatsApp demasiado largo')
  .regex(/^\d+$/, 'El numero de WhatsApp solo admite digitos');

/* ------------------------------------------------------------------ */
/* Paginacion y respuestas                                            */
/* ------------------------------------------------------------------ */

export const paginacionSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type Paginacion = z.infer<typeof paginacionSchema>;

export const paginacionQuerySchema = paginacionSchema.extend({
  search: z.string().trim().optional(),
  sortBy: z.string().trim().optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
});
export const institucionCreateSchema = z.object({
  codigoModular: codigoModularSchema,
  nombre: z.string().trim().min(3, 'El nombre es obligatorio').max(200),
  nivel: z.enum(NIVELES),
  turno: z.enum(TURNOS),
  zona: z.enum(ZONAS),
  ugelId: z.coerce.number().int().positive('Seleccione una UGEL'),
  provinciaId: z.coerce.number().int().positive('Seleccione una provincia'),
  distritoId: z.coerce.number().int().positive('Seleccione un distrito'),
  telefono: telefonoSchema.optional().or(z.literal('')),
  whatsapp: whatsappSchema.optional().or(z.literal('')),
  activo: z.boolean().default(true),
});
export type InstitucionCreateInput = z.infer<typeof institucionCreateSchema>;

export const institucionUpdateSchema = institucionCreateSchema.partial();
export type InstitucionUpdateInput = z.infer<typeof institucionUpdateSchema>;

export const institucionFiltrosSchema = paginacionQuerySchema.extend({
  nivel: z.enum(NIVELES).optional(),
  turno: z.enum(TURNOS).optional(),
  zona: z.enum(ZONAS).optional(),
  ugelId: z.coerce.number().int().positive().optional(),
  provinciaId: z.coerce.number().int().positive().optional(),
  distritoId: z.coerce.number().int().positive().optional(),
  activo: z
    .union([z.boolean(), z.string()])
    .transform((v) => v === true || v === 'true')
    .optional(),
  soloConVacantes: z
    .union([z.boolean(), z.string()])
    .transform((v) => v === true || v === 'true')
    .optional(),
});
export type InstitucionFiltros = z.infer<typeof institucionFiltrosSchema>;

/* ------------------------------------------------------------------ */
/* Vacante de matricula                                               */
/* ------------------------------------------------------------------ */

export const vacanteCreateSchema = z
  .object({
    ieId: z.coerce.number().int().positive(),
    nivel: z.enum(NIVELES),
    turno: z.enum(TURNOS),
    cupoTotal: z.coerce.number().int().min(0, 'El cupo no puede ser negativo').max(1000),
    cupoDisponibles: z.coerce
      .number()
      .int()
      .min(0, 'Los cupos disponibles no pueden ser negativos')
      .max(1000),
    estado: z.enum(ESTADOS_VACANTE).default('LIBRE'),
    fechaLimite: z.coerce.date().optional().nullable(),
  })
  .refine((v) => v.cupoDisponibles <= v.cupoTotal, {
    message: 'Los cupos disponibles no pueden superar el cupo total',
    path: ['cupoDisponibles'],
  });
export type VacanteCreateInput = z.infer<typeof vacanteCreateSchema>;

export const vacanteUpdateSchema = z.object({
  nivel: z.enum(NIVELES).optional(),
  turno: z.enum(TURNOS).optional(),
  cupoTotal: z.coerce.number().int().min(0).max(1000).optional(),
  cupoDisponibles: z.coerce.number().int().min(0).max(1000).optional(),
  estado: z.enum(ESTADOS_VACANTE).optional(),
  fechaLimite: z.coerce.date().optional().nullable(),
});
export type VacanteUpdateInput = z.infer<typeof vacanteUpdateSchema>;

export const vacanteFiltrosSchema = paginacionQuerySchema.extend({
  nivel: z.enum(NIVELES).optional(),
  turno: z.enum(TURNOS).optional(),
  estado: z.enum(ESTADOS_VACANTE).optional(),
  ugelId: z.coerce.number().int().positive().optional(),
  ieId: z.coerce.number().int().positive().optional(),
});


export type RespuestaPaginada<T> = {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

/* ------------------------------------------------------------------ */
/* Convocatoria docente                                                */
/* ------------------------------------------------------------------ */

export const convocatoriaCreateSchema = z.object({
  titulo: z.string().trim().min(5, 'El titulo es obligatorio').max(200),
  numeroRD: z
    .string()
    .trim()
    .min(1, 'El numero de resolucion es obligatorio')
    .max(50)
    .regex(
      /^(?:R\.?\s*D\.?\s*N?[°º]?\s*[\d\-/]+|R\.?\s*D\.?\s+DEMO-\d{4}-\d+)$/i,
      'Formato de resolución inválido (ej: R.D. Nº 00412-2025)',
    ),
  descripcion: z.string().trim().max(2000).optional().nullable(),
  fechaInicio: z.coerce.date(),
  fechaFin: z.coerce.date(),
  fase: z.enum(FASES_CONVOCATORIA).default('INSCRIPCION'),
  pdfMeritosUrl: z
    .string()
    .trim()
    .refine((valor) => {
      if (valor.startsWith('/') && !valor.startsWith('//')) return true;
      try {
        const url = new URL(valor);
        return url.protocol === 'http:' || url.protocol === 'https:';
      } catch {
        return false;
      }
    }, 'Ingresa una URL web o una ruta publica valida')
    .optional()
    .nullable(),
  activo: z.boolean().default(true),
});
export type ConvocatoriaCreateInput = z.infer<typeof convocatoriaCreateSchema>;

export const convocatoriaUpdateSchema = convocatoriaCreateSchema.partial();
export type ConvocatoriaUpdateInput = z.infer<typeof convocatoriaUpdateSchema>;

/* ------------------------------------------------------------------ */
/* Plaza docente                                                       */
/* ------------------------------------------------------------------ */

export const plazaCreateSchema = z.object({
  ieId: z.coerce.number().int().positive(),
  convocatoriaId: z.coerce.number().int().positive(),
  cargo: z.string().trim().min(3, 'El cargo es obligatorio').max(150),
  area: z.string().trim().min(2, 'El area es obligatoria').max(150),
  nivel: z.enum(NIVELES),
  jornada: z.enum(JORNADAS),
  zona: z.enum(ZONAS),
  turno: z.enum(TURNOS),
  tipo: z.enum(TIPOS_PLAZA),
  cantidad: z.coerce.number().int().min(1, 'Debe haber al menos 1 plaza').max(500),
  estado: z.enum(ESTADOS_PLAZA).default('ACTIVA'),
});
export type PlazaCreateInput = z.infer<typeof plazaCreateSchema>;

export const plazaUpdateSchema = z.object({
  ieId: z.coerce.number().int().positive().optional(),
  convocatoriaId: z.coerce.number().int().positive().optional(),
  cargo: z.string().trim().min(3).max(150).optional(),
  area: z.string().trim().min(2).max(150).optional(),
  nivel: z.enum(NIVELES).optional(),
  jornada: z.enum(JORNADAS).optional(),
  zona: z.enum(ZONAS).optional(),
  turno: z.enum(TURNOS).optional(),
  tipo: z.enum(TIPOS_PLAZA).optional(),
  cantidad: z.coerce.number().int().min(1).max(500).optional(),
  estado: z.enum(ESTADOS_PLAZA).optional(),
});
export type PlazaUpdateInput = z.infer<typeof plazaUpdateSchema>;

export const plazaFiltrosSchema = paginacionQuerySchema.extend({
  convocatoriaId: z.coerce.number().int().positive().optional(),
  ugelId: z.coerce.number().int().positive().optional(),
  ieId: z.coerce.number().int().positive().optional(),
  tipo: z.enum(TIPOS_PLAZA).optional(),
  nivel: z.enum(NIVELES).optional(),
  estado: z.enum(ESTADOS_PLAZA).optional(),
});
export type PlazaFiltros = z.infer<typeof plazaFiltrosSchema>;

/* Local escolar                                                      */
/* ------------------------------------------------------------------ */

export const localCreateSchema = z.object({
  ieId: z.coerce.number().int().positive(),
  codigoLocal: codigoLocalSchema,
  estado: z.enum(ESTADOS_LOCAL),
  aulasOperativas: z.coerce.number().int().min(0).max(500),
  aulasTotales: z.coerce.number().int().min(0).max(500),
  agua: z.enum(ESTADOS_SERVICIO).default('NO_DISPONIBLE'),
  luz: z.boolean().default(false),
  fibra: z.boolean().default(false),
  capacidadAlumnos: z.coerce.number().int().min(0).max(10000).optional().nullable(),
  avanceObras: z.coerce.number().min(0).max(100).optional().nullable(),
  presupuesto: z.coerce.number().min(0).optional().nullable(),
  fichaEdanUrl: z
    .string()
    .trim()
    .refine((valor) => {
      if (valor.startsWith('/') && !valor.startsWith('//')) return true;
      try {
        const url = new URL(valor);
        return url.protocol === 'http:' || url.protocol === 'https:';
      } catch {
        return false;
      }
    }, 'Ingresa una URL web o una ruta publica valida')
    .optional()
    .nullable(),
  fotos: z.array(z.string().trim()).max(10, 'Maximo 10 fotos por local').default([]),
  ultimaInspeccion: z.coerce.date().optional().nullable(),
});
export type LocalCreateInput = z.infer<typeof localCreateSchema>;

export const localUpdateSchema = localCreateSchema.partial();
export type LocalUpdateInput = z.infer<typeof localUpdateSchema>;

export const localFiltrosSchema = paginacionQuerySchema.extend({
  provinciaId: z.coerce.number().int().positive().optional(),
  ugelId: z.coerce.number().int().positive().optional(),
  estado: z.enum(ESTADOS_LOCAL).optional(),
  prioritario: z
    .union([z.boolean(), z.string()])
    .transform((v) => v === true || v === 'true')
    .optional(),
});
export type LocalFiltros = z.infer<typeof localFiltrosSchema>;

/* ------------------------------------------------------------------ */
/* Alerta ciudadana                                                   */
/* ------------------------------------------------------------------ */

export const alertaCreateSchema = z.object({
  localEscolarId: z.coerce.number().int().positive(),
  ieId: z.coerce.number().int().positive(),
  tipo: z.enum(TIPOS_ALERTA),
  descripcion: z.string().trim().min(10, 'Describa el problema con al menos 10 caracteres').max(2000),
  fotos: z.array(z.string().trim()).max(10, 'Maximo 10 fotos por alerta').default([]),
  reportadoPor: z.string().trim().min(3, 'Indique quien reporta').max(150),
  telefonoReporte: telefonoSchema.optional().or(z.literal('')),
});
export type AlertaCreateInput = z.infer<typeof alertaCreateSchema>;

export const alertaEstadoSchema = z.object({
  estado: z.enum(ESTADOS_ALERTA),
  observacion: z.string().trim().max(1000).optional().nullable(),
});
export type AlertaEstadoInput = z.infer<typeof alertaEstadoSchema>;

/* ------------------------------------------------------------------ */
/* Comunicado                                                          */
/* ------------------------------------------------------------------ */

export const comunicadoCreateSchema = z.object({
  titulo: z.string().trim().min(5, 'El titulo es obligatorio').max(200),
  categoria: z.enum(CATEGORIAS_COMUNICADO),
  resumen: z.string().trim().min(10, 'El resumen es obligatorio').max(500),
  contenido: z.string().trim().max(5000).optional().nullable(),
  fecha: z.coerce.date(),
  imagenUrl: z.string().trim().url('URL invalida').optional().nullable(),
  publicado: z.boolean().default(false),
});
export type ComunicadoCreateInput = z.infer<typeof comunicadoCreateSchema>;

export const comunicadoUpdateSchema = comunicadoCreateSchema.partial();
export type ComunicadoUpdateInput = z.infer<typeof comunicadoUpdateSchema>;

/* ------------------------------------------------------------------ */
/* Usuarios                                                           */
/* ------------------------------------------------------------------ */

export const usuarioCreateSchema = z.object({
  nombre: z.string().trim().min(3, 'El nombre es obligatorio').max(150),
  email: z.string().trim().toLowerCase().email('Email invalido'),
  password: z.string().min(8, 'La contrasena debe tener al menos 8 caracteres').max(100),
  rol: z.enum(ROLES).default('CONSULTOR'),
  ugelId: z.coerce.number().int().positive().optional().nullable(),
  activo: z.boolean().default(true),
});
export type UsuarioCreateInput = z.infer<typeof usuarioCreateSchema>;

export const usuarioUpdateSchema = z.object({
  nombre: z.string().trim().min(3).max(150).optional(),
  email: z.string().trim().toLowerCase().email('Email invalido').optional(),
  password: z.string().min(8).max(100).optional(),
  rol: z.enum(ROLES).optional(),
  ugelId: z.coerce.number().int().positive().optional().nullable(),
  activo: z.boolean().optional(),
});
export type UsuarioUpdateInput = z.infer<typeof usuarioUpdateSchema>;

/* ------------------------------------------------------------------ */
/* Autenticacion                                                      */
/* ------------------------------------------------------------------ */

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email invalido'),
  password: z.string().min(1, 'La contrasena es obligatoria'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(10, 'Refresh token invalido'),
});
export type RefreshInput = z.infer<typeof refreshSchema>;
/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

/** Convierte un valor opcional de query en un string, o undefined. */
export function qs(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  const s = String(value).trim();
  return s.length > 0 ? s : undefined;
}

/** Convierte "true"/"false" en booleano; undefined si no aplica. */
export function qsBool(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return value === true || value === 'true';
}

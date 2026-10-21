import type { RespuestaPaginada } from '@shared';

/**
 * Tipos de fila tal como los devuelve la API (con los `include` de cada
 * servicio). Se modelan solo los campos que usa el panel, no la entidad
 * Prisma completa.
 */

export interface InstitucionResumen {
  id: number;
  codigoModular: string;
  nombre: string;
}

export interface UgelResumen {
  id: number;
  nombre: string;
}

/* ------------------------------------------------------------------ */
/* Convocatorias                                                       */
/* ------------------------------------------------------------------ */

export interface Convocatoria {
  id: number;
  titulo: string;
  numeroRD: string;
  fechaInicio: string;
  fechaFin: string;
  fase: string;
  activo: boolean;
  descripcion: string | null;
  _count?: { plazas: number };
}

/* ------------------------------------------------------------------ */
/* Vacantes                                                            */
/* ------------------------------------------------------------------ */

export interface Vacante {
  id: number;
  ieId: number;
  nivel: string;
  turno: string;
  fechaLimite: string | null;
  cupoTotal: number;
  cupoDisponibles: number;
  estado: string;
  ie?: InstitucionResumen & { ugel?: UgelResumen | null; distrito?: { id: number; nombre: string } | null };
}

export interface ResumenCupos {
  porNivel: { nivel: string; _sum: { cupoTotal: number | null; cupoDisponibles: number | null }; _count: { _all: number } }[];
  porEstado: { estado: string; _count: { _all: number }; _sum: { cupoTotal: number | null; cupoDisponibles: number | null } }[];
}

/* ------------------------------------------------------------------ */
/* Plazas                                                              */
/* ------------------------------------------------------------------ */

export interface Plaza {
  id: number;
  ieId: number;
  convocatoriaId: number | null;
  cargo: string;
  area: string;
  jornada: string;
  nivel: string;
  zona: string;
  turno: string;
  tipo: string;
  cantidad: number;
  estado: string;
  ie?: InstitucionResumen & {
    ugel?: UgelResumen | null;
    distrito?: { id: number; nombre: string } | null;
    provincia?: { id: number; nombre: string } | null;
  };
  convocatoria?: { id: number; titulo: string; numeroRD: string; fase: string } | null;
}

/* ------------------------------------------------------------------ */
/* Alertas                                                             */
/* ------------------------------------------------------------------ */

export interface Alerta {
  id: number;
  tipo: string;
  estado: string;
  descripcion: string;
  reportadoPor: string;
  telefonoReporte: string | null;
  observacion: string | null;
  resueltoEn: string | null;
  createdAt: string;
  ie?: InstitucionResumen | null;
  localEscolar?: { id: number; codigoLocal: string; estado: string } | null;
}

export interface LocalEscolar {
  id: number;
  ieId: number;
  codigoLocal: string;
  estado: string;
  aulasOperativas: number;
  aulasTotales: number;
  agua: string;
  luz: boolean;
  fibra: boolean;
  capacidadAlumnos: number | null;
  avanceObras: number | string | null;
  presupuesto: number | string | null;
  fichaEdanUrl: string | null;
  ultimaInspeccion: string | null;
  ie?: InstitucionResumen & {
    ugel?: UgelResumen | null;
    distrito?: {
      id: number;
      nombre: string;
      provincia?: { id: number; nombre: string } | null;
    } | null;
  };
  _count?: { alertas: number };
}

/* ------------------------------------------------------------------ */
/* Catalogos                                                           */
/* ------------------------------------------------------------------ */

export interface OpcionCatalogo {
  id: number;
  codigo: string;
  nombre: string;
  provinciaId?: number;
}

/** Alias del envelope paginado de la API para abreviar los genericos. */
export type Pagina<T> = RespuestaPaginada<T>;

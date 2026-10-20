/**
 * Enums del dominio Educa Lambayeque.
 *
 * Fuente: derivacion de las 4 pantallas Stitch (inicio, vacantes, plazas,
 * infraestructura). Los valores coinciden con los que usan las bases de
 * datos oficiales (niveles, zonas, jornadas y estados de convocatoria).
 */

/* ------------------------------------------------------------------ */
/* Educacion                                                          */
/* ------------------------------------------------------------------ */

export const NIVELES = [
  'INICIAL_JARDIN',
  'PRIMARIA',
  'SECUNDARIA',
  'EBE',
] as const;
export type NivelEducativo = (typeof NIVELES)[number];

export const TURNOS = ['MANANA', 'TARDE', 'MANANA_Y_TARDE', 'COMPLETO', 'CONTINUO_DIURNO'] as const;
export type Turno = (typeof TURNOS)[number];

export const ZONAS = ['URBANA', 'RURAL_1', 'RURAL_2', 'RURAL_3_EIB'] as const;
export type Zona = (typeof ZONAS)[number];

export const JORNADAS = ['JORNADA_30', 'JORNADA_35', 'JORNADA_40', 'JORNADA_25'] as const;
export type Jornada = (typeof JORNADAS)[number];

export const ETIQUETAS_JORNADA: Record<Jornada, string> = {
  JORNADA_30: '30 horas',
  JORNADA_35: '35 horas',
  JORNADA_40: '40 horas',
  JORNADA_25: '25 horas',
};

/* ------------------------------------------------------------------ */
/* Vacantes de matricula                                              */
/* ------------------------------------------------------------------ */

export const ESTADOS_VACANTE = ['LIBRE', 'COMPLETO', 'LISTA_ESPERA', 'CERRADO'] as const;
export type EstadoVacante = (typeof ESTADOS_VACANTE)[number];

/* ------------------------------------------------------------------ */
/* Plazas docentes                                                    */
/* ------------------------------------------------------------------ */

export const TIPOS_PLAZA = ['ORGANICA', 'EVENTUAL_CUADRO', 'REEMPLAZO_LICENCIA', 'POR_EVALUACION'] as const;
export type TipoPlaza = (typeof TIPOS_PLAZA)[number];

export const ESTADOS_PLAZA = ['ACTIVA', 'ADJUDICADA', 'CERRADA', 'CONVOCADA'] as const;
export type EstadoPlaza = (typeof ESTADOS_PLAZA)[number];

export const FASES_CONVOCATORIA = ['INSCRIPCION', 'ADJUDICACION', 'CONTRATACION', 'FINALIZADA'] as const;
export type FaseConvocatoria = (typeof FASES_CONVOCATORIA)[number];

/* ------------------------------------------------------------------ */
/* Infraestructura                                                    */
/* ------------------------------------------------------------------ */

export const ESTADOS_LOCAL = [
  'OPTIMO',
  'MANTENIMIENTO_PREVENTIVO',
  'EN_REFRACCION',
  'AULAS_TEMPORALES',
  'ATENCION_PRIORITARIA',
  'OPERATIVO_REGULAR',
] as const;
export type EstadoLocal = (typeof ESTADOS_LOCAL)[number];

export const ESTADOS_SERVICIO = ['AGUA_24H', 'CISTERNA', 'RED_OK', 'NO_DISPONIBLE'] as const;
export type EstadoServicio = (typeof ESTADOS_SERVICIO)[number];

export const ESTADOS_ALERTA = ['ABIERTA', 'EN_ATENCION', 'RESUELTA', 'DESCARTADA'] as const;
export type EstadoAlerta = (typeof ESTADOS_ALERTA)[number];

export const TIPOS_ALERTA = [
  'FILTRACION',
  'AULA_DETERIORADA',
  'FALTA_AGUA',
  'FALTA_LUZ',
  'OTRO',
] as const;
export type TipoAlerta = (typeof TIPOS_ALERTA)[number];

/* ------------------------------------------------------------------ */
/* Comunicados                                                        */
/* ------------------------------------------------------------------ */

export const CATEGORIAS_COMUNICADO = ['MATERIALES', 'CAPACITACION', 'CONVOCATORIA', 'NORMATIVA', 'SERVICIO'] as const;
export type CategoriaComunicado = (typeof CATEGORIAS_COMUNICADO)[number];

/* ------------------------------------------------------------------ */
/* Plataforma / usuarios                                              */
/* ------------------------------------------------------------------ */

export const ROLES = ['ADMIN_GRED', 'EDITOR_UGEL', 'CONSULTOR'] as const;
export type Rol = (typeof ROLES)[number];

/* ------------------------------------------------------------------ */
/* Etiquetas legibles para la UI                                      */
/* ------------------------------------------------------------------ */

export const ETIQUETAS_NIVEL: Record<NivelEducativo, string> = {
  INICIAL_JARDIN: 'Inicial - Jardin',
  PRIMARIA: 'Primaria',
  SECUNDARIA: 'Secundaria',
  EBE: 'EBE',
};

export const ETIQUETAS_TURNO: Record<Turno, string> = {
  MANANA: 'Manana',
  TARDE: 'Tarde',
  MANANA_Y_TARDE: 'Manana y Tarde',
  COMPLETO: 'Completo',
  CONTINUO_DIURNO: 'Continuo Diurno',
};

export const ETIQUETAS_ZONA: Record<Zona, string> = {
  URBANA: 'Urbana',
  RURAL_1: 'Rural 1',
  RURAL_2: 'Rural 2',
  RURAL_3_EIB: 'Rural 3 (Bono EIB)',
};

export const ETIQUETAS_TIPO_PLAZA: Record<TipoPlaza, string> = {
  ORGANICA: 'Organica',
  EVENTUAL_CUADRO: 'Eventual por Cuadro',
  REEMPLAZO_LICENCIA: 'Reemplazo por Licencia',
  POR_EVALUACION: 'Por Evaluacion',
};

export const ETIQUETAS_ESTADO_PLAZA: Record<EstadoPlaza, string> = {
  ACTIVA: 'Activa',
  ADJUDICADA: 'Adjudicada',
  CERRADA: 'Cerrada',
  CONVOCADA: 'Convocada',
};

export const ETIQUETAS_ESTADO_VACANTE: Record<EstadoVacante, string> = {
  LIBRE: 'Vacantes Libres',
  COMPLETO: 'Cupo Completo',
  LISTA_ESPERA: 'Lista de Espera',
  CERRADO: 'Cerrado',
};

export const ETIQUETAS_ESTADO_LOCAL: Record<EstadoLocal, string> = {
  OPTIMO: 'Optimo',
  MANTENIMIENTO_PREVENTIVO: 'Mantenimiento Preventivo',
  EN_REFRACCION: 'En Refaccion',
  AULAS_TEMPORALES: 'Aulas Temporales',
  ATENCION_PRIORITARIA: 'Atencion Prioritaria',
  OPERATIVO_REGULAR: 'Operativo Regular',
};

export const ETIQUETAS_ESTADO_ALERTA: Record<EstadoAlerta, string> = {
  ABIERTA: 'Abierta',
  EN_ATENCION: 'En Atencion',
  RESUELTA: 'Resuelta',
  DESCARTADA: 'Descartada',
};

export const ETIQUETAS_ROL: Record<Rol, string> = {
  ADMIN_GRED: 'Administrador GRED',
  EDITOR_UGEL: 'Editor UGEL',
  CONSULTOR: 'Consultor',
};

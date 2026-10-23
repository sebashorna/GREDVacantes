/**
 * Seed - Educa Lambayeque.
 *
 * IMPORTANTE: los datos de negocio son FICTICIOS. Replican lo que se ve en
 * los mockups Stitch para poder desarrollar y demostrar el panel, pero NO
 * provienen de la base de datos oficial del MINEDU.
 *
 * Los catalogos (UGEL, Provincia, Distrito) usan los codigos y nombres
 * reales de Lambayeque: esos si se consideran estables.
 *
 * El seed es idempotente: se puede ejecutar varias veces sin duplicar.
 */
import { PrismaClient, type Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/* ------------------------------------------------------------------ */
/* Catalogos (datos reales de Lambayeque)                              */
/* ------------------------------------------------------------------ */

const UGELES = [
  { codigo: 'UGEL-LAM-01', nombre: 'UGEL Lambayeque' },
  { codigo: 'UGEL-LAM-02', nombre: 'UGEL Chiclayo' },
  { codigo: 'UGEL-LAM-03', nombre: 'UGEL Ferreñafe' },
  { codigo: 'UGEL-LAM-04', nombre: 'UGEL Lambayeque Rural 1' },
  { codigo: 'UGEL-LAM-05', nombre: 'UGEL Lambayeque Rural 2' },
  { codigo: 'UGEL-LAM-06', nombre: 'UGEL Lambayeque Rural 3 EIB' },
];

const PROVINCIAS = [
  { codigo: 'LAM-01', nombre: 'Lambayeque' },
  { codigo: 'LAM-02', nombre: 'Chiclayo' },
  { codigo: 'LAM-03', nombre: 'Ferreñafe' },
];

const DISTRITOS = [
  { codigo: 'LAM-01-01', nombre: 'Lambayeque', provincia: 'LAM-01' },
  { codigo: 'LAM-01-02', nombre: 'San José', provincia: 'LAM-01' },
  { codigo: 'LAM-01-03', nombre: 'Pimentel', provincia: 'LAM-01' },
  { codigo: 'LAM-01-04', nombre: 'SUCESOS', provincia: 'LAM-01' },
  { codigo: 'LAM-02-01', nombre: 'Chiclayo', provincia: 'LAM-02' },
  { codigo: 'LAM-02-02', nombre: 'Monsefú', provincia: 'LAM-02' },
  { codigo: 'LAM-02-03', nombre: 'La Pradera', provincia: 'LAM-02' },
  { codigo: 'LAM-03-01', nombre: 'Ferreñafe', provincia: 'LAM-03' },
  { codigo: 'LAM-03-02', nombre: 'Pítipo', provincia: 'LAM-03' },
  { codigo: 'LAM-03-03', nombre: 'Moyapampa', provincia: 'LAM-03' },
];

/* ------------------------------------------------------------------ */
/* Instituciones educativas (FICTICIAS)                                */
/* ------------------------------------------------------------------ */

interface IeSemilla {
  codigoModular: string;
  nombre: string;
  nivel: 'INICIAL_JARDIN' | 'PRIMARIA' | 'SECUNDARIA' | 'EBE';
  turno: 'MANANA' | 'TARDE' | 'MANANA_Y_TARDE' | 'COMPLETO' | 'CONTINUO_DIURNO';
  zona: 'URBANA' | 'RURAL_1' | 'RURAL_2' | 'RURAL_3_EIB';
  ugel: string;
  distrito: string;
  telefono: string;
  whatsapp: string;
}

const INSTITUCIONES: IeSemilla[] = [
  {
    codigoModular: '1580001',
    nombre: 'I.E. Pedro Ruiz Gallo',
    nivel: 'SECUNDARIA',
    turno: 'MANANA',
    zona: 'URBANA',
    ugel: 'UGEL-LAM-01',
    distrito: 'LAM-01-01',
    telefono: '051-362145',
    whatsapp: '51987654321',
  },
  {
    codigoModular: '1580002',
    nombre: 'I.E. Coronel Castilla',
    nivel: 'PRIMARIA',
    turno: 'MANANA_Y_TARDE',
    zona: 'URBANA',
    ugel: 'UGEL-LAM-01',
    distrito: 'LAM-01-01',
    telefono: '051-362146',
    whatsapp: '51987654322',
  },
  {
    codigoModular: '1580003',
    nombre: 'I.E. San José',
    nivel: 'PRIMARIA',
    turno: 'MANANA',
    zona: 'URBANA',
    ugel: 'UGEL-LAM-01',
    distrito: 'LAM-01-02',
    telefono: '051-362147',
    whatsapp: '51987654323',
  },
  {
    codigoModular: '1580004',
    nombre: 'I.E. Andrés Avelino Cáceres',
    nivel: 'SECUNDARIA',
    turno: 'COMPLETO',
    zona: 'RURAL_1',
    ugel: 'UGEL-LAM-04',
    distrito: 'LAM-01-04',
    telefono: '051-362148',
    whatsapp: '51987654324',
  },
  {
    codigoModular: '1580005',
    nombre: 'I.E. San Pedro',
    nivel: 'INICIAL_JARDIN',
    turno: 'MANANA',
    zona: 'RURAL_2',
    ugel: 'UGEL-LAM-05',
    distrito: 'LAM-03-02',
    telefono: '051-362149',
    whatsapp: '51987654325',
  },
  {
    codigoModular: '1580006',
    nombre: 'I.E. Santa Rosa',
    nivel: 'PRIMARIA',
    turno: 'CONTINUO_DIURNO',
    zona: 'RURAL_3_EIB',
    ugel: 'UGEL-LAM-06',
    distrito: 'LAM-03-03',
    telefono: '051-362150',
    whatsapp: '51987654326',
  },
  {
    codigoModular: '1580007',
    nombre: 'I.E. Augusto Nicolas de Piura',
    nivel: 'SECUNDARIA',
    turno: 'MANANA_Y_TARDE',
    zona: 'URBANA',
    ugel: 'UGEL-LAM-02',
    distrito: 'LAM-02-01',
    telefono: '051-362151',
    whatsapp: '51987654327',
  },
  {
    codigoModular: '1580008',
    nombre: 'I.E. Tomas Enrique',
    nivel: 'PRIMARIA',
    turno: 'TARDE',
    zona: 'RURAL_1',
    ugel: 'UGEL-LAM-04',
    distrito: 'LAM-01-04',
    telefono: '051-362152',
    whatsapp: '51987654328',
  },
  {
    codigoModular: '1580009',
    nombre: 'I.E. Ilímico',
    nivel: 'EBE',
    turno: 'MANANA',
    zona: 'RURAL_1',
    ugel: 'UGEL-LAM-04',
    distrito: 'LAM-01-04',
    telefono: '051-362153',
    whatsapp: '51987654329',
  },
  {
    codigoModular: '1580010',
    nombre: 'I.E. San Francisco',
    nivel: 'PRIMARIA',
    turno: 'MANANA',
    zona: 'RURAL_2',
    ugel: 'UGEL-LAM-05',
    distrito: 'LAM-03-01',
    telefono: '051-362154',
    whatsapp: '51987654330',
  },
];

const NUMERO_RD_DEMO = 'RD DEMO-2026-0412';
const NUMERO_RD_ANTERIOR = 'R.D. Nº 00412-2025';
const NUMERO_RD_ANTERIOR_LEGACY = `R.D. N${String.fromCharCode(194)}º 00412-2025`;
const FECHA_LIMITE_MATRICULA = new Date('2026-11-30T23:59:59');

/* ------------------------------------------------------------------ */
/* Vacantes, locales, plazas, alertas y comunicados (FICTICIOS)        */
/* ------------------------------------------------------------------ */

interface VacanteSemilla {
  codigoModular: string;
  nivel: IeSemilla['nivel'];
  turno: IeSemilla['turno'];
  cupoTotal: number;
  cupoDisponibles: number;
  estado: 'LIBRE' | 'COMPLETO' | 'LISTA_ESPERA' | 'CERRADO';
  fechaLimite?: Date;
}

const VACANTES: VacanteSemilla[] = [
  { codigoModular: '1580001', nivel: 'SECUNDARIA', turno: 'MANANA', cupoTotal: 200, cupoDisponibles: 45, estado: 'LIBRE', fechaLimite: FECHA_LIMITE_MATRICULA },
  { codigoModular: '1580002', nivel: 'PRIMARIA', turno: 'TARDE', cupoTotal: 120, cupoDisponibles: 12, estado: 'LIBRE', fechaLimite: FECHA_LIMITE_MATRICULA },
  { codigoModular: '1580002', nivel: 'PRIMARIA', turno: 'MANANA', cupoTotal: 120, cupoDisponibles: 0, estado: 'COMPLETO', fechaLimite: FECHA_LIMITE_MATRICULA },
  { codigoModular: '1580003', nivel: 'PRIMARIA', turno: 'MANANA', cupoTotal: 210, cupoDisponibles: 0, estado: 'LISTA_ESPERA', fechaLimite: FECHA_LIMITE_MATRICULA },
  { codigoModular: '1580004', nivel: 'SECUNDARIA', turno: 'COMPLETO', cupoTotal: 150, cupoDisponibles: 22, estado: 'LIBRE', fechaLimite: FECHA_LIMITE_MATRICULA },
  { codigoModular: '1580005', nivel: 'INICIAL_JARDIN', turno: 'MANANA', cupoTotal: 90, cupoDisponibles: 5, estado: 'LIBRE', fechaLimite: FECHA_LIMITE_MATRICULA },
  { codigoModular: '1580006', nivel: 'PRIMARIA', turno: 'CONTINUO_DIURNO', cupoTotal: 120, cupoDisponibles: 0, estado: 'CERRADO', fechaLimite: new Date('2026-10-15T23:59:59') },
  { codigoModular: '1580007', nivel: 'SECUNDARIA', turno: 'MANANA_Y_TARDE', cupoTotal: 400, cupoDisponibles: 60, estado: 'LIBRE', fechaLimite: FECHA_LIMITE_MATRICULA },
  { codigoModular: '1580008', nivel: 'PRIMARIA', turno: 'TARDE', cupoTotal: 180, cupoDisponibles: 18, estado: 'LIBRE', fechaLimite: FECHA_LIMITE_MATRICULA },
  { codigoModular: '1580009', nivel: 'EBE', turno: 'MANANA', cupoTotal: 60, cupoDisponibles: 14, estado: 'LIBRE', fechaLimite: FECHA_LIMITE_MATRICULA },
  { codigoModular: '1580010', nivel: 'PRIMARIA', turno: 'MANANA', cupoTotal: 200, cupoDisponibles: 25, estado: 'LIBRE', fechaLimite: FECHA_LIMITE_MATRICULA },
];

interface LocalSemilla {
  codigoLocal: string;
  codigoModular: string;
  estado: 'OPTIMO' | 'MANTENIMIENTO_PREVENTIVO' | 'EN_REFRACCION' | 'AULAS_TEMPORALES' | 'ATENCION_PRIORITARIA' | 'OPERATIVO_REGULAR';
  aulasOperativas: number;
  aulasTotales: number;
  agua: 'AGUA_24H' | 'CISTERNA' | 'RED_OK' | 'NO_DISPONIBLE';
  luz: boolean;
  fibra: boolean;
  capacidadAlumnos: number;
  avanceObras?: number;
  presupuesto?: number;
}

const LOCALES: LocalSemilla[] = [
  { codigoLocal: '1580001', codigoModular: '1580001', estado: 'OPTIMO', aulasOperativas: 18, aulasTotales: 18, agua: 'AGUA_24H', luz: true, fibra: true, capacidadAlumnos: 320 },
  { codigoLocal: '1580002', codigoModular: '1580002', estado: 'MANTENIMIENTO_PREVENTIVO', aulasOperativas: 12, aulasTotales: 14, agua: 'AGUA_24H', luz: true, fibra: false, capacidadAlumnos: 240 },
  { codigoLocal: '1580003', codigoModular: '1580003', estado: 'EN_REFRACCION', aulasOperativas: 8, aulasTotales: 12, agua: 'CISTERNA', luz: true, fibra: false, capacidadAlumnos: 210, avanceObras: 65, presupuesto: 185000 },
  { codigoLocal: '1580004', codigoModular: '1580004', estado: 'AULAS_TEMPORALES', aulasOperativas: 6, aulasTotales: 10, agua: 'NO_DISPONIBLE', luz: false, fibra: false, capacidadAlumnos: 150, avanceObras: 30, presupuesto: 240000 },
  { codigoLocal: '1580005', codigoModular: '1580005', estado: 'OPTIMO', aulasOperativas: 5, aulasTotales: 5, agua: 'CISTERNA', luz: true, fibra: false, capacidadAlumnos: 90 },
  { codigoLocal: '1580006', codigoModular: '1580006', estado: 'ATENCION_PRIORITARIA', aulasOperativas: 3, aulasTotales: 8, agua: 'NO_DISPONIBLE', luz: false, fibra: false, capacidadAlumnos: 120, presupuesto: 320000 },
  { codigoLocal: '1580007', codigoModular: '1580007', estado: 'OPTIMO', aulasOperativas: 22, aulasTotales: 22, agua: 'AGUA_24H', luz: true, fibra: true, capacidadAlumnos: 400 },
  { codigoLocal: '1580008', codigoModular: '1580008', estado: 'OPERATIVO_REGULAR', aulasOperativas: 9, aulasTotales: 10, agua: 'AGUA_24H', luz: true, fibra: false, capacidadAlumnos: 180 },
  { codigoLocal: '1580009', codigoModular: '1580009', estado: 'EN_REFRACCION', aulasOperativas: 2, aulasTotales: 4, agua: 'NO_DISPONIBLE', luz: false, fibra: false, capacidadAlumnos: 60, avanceObras: 20, presupuesto: 95000 },
  { codigoLocal: '1580010', codigoModular: '1580010', estado: 'MANTENIMIENTO_PREVENTIVO', aulasOperativas: 10, aulasTotales: 11, agua: 'CISTERNA', luz: true, fibra: false, capacidadAlumnos: 200 },
];

interface PlazaSemilla {
  codigoModular: string;
  numeroRD: string;
  cargo: string;
  area: string;
  nivel: IeSemilla['nivel'];
  jornada: 'JORNADA_30' | 'JORNADA_35' | 'JORNADA_40' | 'JORNADA_25';
  zona: IeSemilla['zona'];
  turno: IeSemilla['turno'];
  tipo: 'ORGANICA' | 'EVENTUAL_CUADRO' | 'REEMPLAZO_LICENCIA' | 'POR_EVALUACION';
  cantidad: number;
  estado: 'ACTIVA' | 'ADJUDICADA' | 'CERRADA' | 'CONVOCADA';
}

const PLAZAS: PlazaSemilla[] = [
  { codigoModular: '1580001', numeroRD: NUMERO_RD_DEMO, cargo: 'DOCENTE', area: 'MATEMATICA', nivel: 'SECUNDARIA', jornada: 'JORNADA_30', zona: 'URBANA', turno: 'MANANA', tipo: 'ORGANICA', cantidad: 4, estado: 'CONVOCADA' },
  { codigoModular: '1580001', numeroRD: NUMERO_RD_DEMO, cargo: 'DOCENTE', area: 'LENGUA CASTELLANA', nivel: 'SECUNDARIA', jornada: 'JORNADA_30', zona: 'URBANA', turno: 'MANANA', tipo: 'ORGANICA', cantidad: 3, estado: 'CONVOCADA' },
  { codigoModular: '1580001', numeroRD: NUMERO_RD_DEMO, cargo: 'DOCENTE', area: 'CIENCIAS SOCIALES', nivel: 'SECUNDARIA', jornada: 'JORNADA_30', zona: 'URBANA', turno: 'MANANA', tipo: 'EVENTUAL_CUADRO', cantidad: 2, estado: 'CONVOCADA' },
  { codigoModular: '1580002', numeroRD: NUMERO_RD_DEMO, cargo: 'DOCENTE', area: 'PRIMARIA', nivel: 'PRIMARIA', jornada: 'JORNADA_30', zona: 'URBANA', turno: 'TARDE', tipo: 'ORGANICA', cantidad: 3, estado: 'ADJUDICADA' },
  { codigoModular: '1580003', numeroRD: NUMERO_RD_DEMO, cargo: 'DOCENTE', area: 'PRIMARIA', nivel: 'PRIMARIA', jornada: 'JORNADA_30', zona: 'URBANA', turno: 'MANANA', tipo: 'REEMPLAZO_LICENCIA', cantidad: 1, estado: 'CONVOCADA' },
  { codigoModular: '1580004', numeroRD: NUMERO_RD_DEMO, cargo: 'DOCENTE', area: 'MATEMATICA', nivel: 'SECUNDARIA', jornada: 'JORNADA_30', zona: 'RURAL_1', turno: 'COMPLETO', tipo: 'POR_EVALUACION', cantidad: 5, estado: 'CONVOCADA' },
  { codigoModular: '1580006', numeroRD: NUMERO_RD_DEMO, cargo: 'DOCENTE', area: 'INTERCULTURAL BILINGUE', nivel: 'PRIMARIA', jornada: 'JORNADA_30', zona: 'RURAL_3_EIB', turno: 'CONTINUO_DIURNO', tipo: 'ORGANICA', cantidad: 6, estado: 'CONVOCADA' },
  { codigoModular: '1580007', numeroRD: NUMERO_RD_DEMO, cargo: 'DOCENTE', area: 'COMUNICACION', nivel: 'SECUNDARIA', jornada: 'JORNADA_40', zona: 'URBANA', turno: 'MANANA_Y_TARDE', tipo: 'ORGANICA', cantidad: 2, estado: 'CONVOCADA' },
  { codigoModular: '1580008', numeroRD: NUMERO_RD_DEMO, cargo: 'DOCENTE', area: 'PRIMARIA', nivel: 'PRIMARIA', jornada: 'JORNADA_30', zona: 'RURAL_1', turno: 'TARDE', tipo: 'EVENTUAL_CUADRO', cantidad: 4, estado: 'CONVOCADA' },
  { codigoModular: '1580009', numeroRD: NUMERO_RD_DEMO, cargo: 'DOCENTE', area: 'EDUCACION FISICA', nivel: 'EBE', jornada: 'JORNADA_25', zona: 'RURAL_1', turno: 'MANANA', tipo: 'REEMPLAZO_LICENCIA', cantidad: 1, estado: 'CERRADA' },
  { codigoModular: '1580010', numeroRD: NUMERO_RD_DEMO, cargo: 'DOCENTE', area: 'PRIMARIA', nivel: 'PRIMARIA', jornada: 'JORNADA_30', zona: 'RURAL_2', turno: 'MANANA', tipo: 'ORGANICA', cantidad: 3, estado: 'CONVOCADA' },
];

interface AlertaSemilla {
  codigoLocal: string;
  codigoModular: string;
  tipo: 'FILTRACION' | 'AULA_DETERIORADA' | 'FALTA_AGUA' | 'FALTA_LUZ' | 'OTRO';
  descripcion: string;
  reportadoPor: string;
  telefonoReporte: string;
  estado: 'ABIERTA' | 'EN_ATENCION' | 'RESUELTA' | 'DESCARTADA';
  observacion?: string;
}

const ALERTAS: AlertaSemilla[] = [
  { codigoLocal: '1580003', codigoModular: '1580003', tipo: 'FILTRACION', descripcion: 'Filtracion de agua en el techo del aula 3, afecta a los estudiantes durante las clases.', reportadoPor: 'Maria Fernandez', telefonoReporte: '051-362147', estado: 'ABIERTA' },
  { codigoLocal: '1580004', codigoModular: '1580004', tipo: 'FALTA_AGUA', descripcion: 'La institucion no cuenta con servicio de agua desde hace una semana.', reportadoPor: 'Carlos Ramirez', telefonoReporte: '051-362148', estado: 'EN_ATENCION' },
  { codigoLocal: '1580006', codigoModular: '1580006', tipo: 'AULA_DETERIORADA', descripcion: 'Aulas temporales sin techo en temporada de lluvias, riesgo para los estudiantes.', reportadoPor: 'Ana Quispe', telefonoReporte: '051-362150', estado: 'ABIERTA' },
  { codigoLocal: '1580009', codigoModular: '1580009', tipo: 'FALTA_LUZ', descripcion: 'No hay energizacion electrica en la institucion, se usa mecha.', reportadoPor: 'Jose Rojas', telefonoReporte: '051-362153', estado: 'ABIERTA' },
  { codigoLocal: '1580002', codigoModular: '1580002', tipo: 'OTRO', descripcion: 'Pared de los banos en mal estado, se solicita mantenimiento.', reportadoPor: 'Lucia Diaz', telefonoReporte: '051-362146', estado: 'RESUELTA', observacion: 'Reparacion menor completada en este escenario demostrativo.' },
  { codigoLocal: '1580010', codigoModular: '1580010', tipo: 'FILTRACION', descripcion: 'Filtracion menor en el pasillo del segundo piso.', reportadoPor: 'Pedro Sanchez', telefonoReporte: '051-362154', estado: 'EN_ATENCION', observacion: 'Inspeccion tecnica programada en el escenario demostrativo.' },
  { codigoLocal: '1580007', codigoModular: '1580007', tipo: 'OTRO', descripcion: 'Reporte duplicado de una incidencia que ya fue inspeccionada.', reportadoPor: 'Rosa Torres', telefonoReporte: '051-362155', estado: 'DESCARTADA', observacion: 'Se descarta por duplicidad en este escenario demostrativo.' },
];

const COMUNICADOS = [
  { titulo: 'Convocatoria demostrativa 2026 - Plazas docentes', tituloAnterior: 'Convocatoria 2025 - Plazas docentes', categoria: 'CONVOCATORIA' as const, resumen: 'Informacion ficticia para la demostracion de plazas docentes; no representa una convocatoria oficial.', fecha: new Date('2026-10-01'), publicado: true },
  { titulo: 'Calendario demostrativo de matricula 2026', tituloAnterior: 'Calendario de matricula 2025', categoria: 'NORMATIVA' as const, resumen: 'Cronograma ficticio para mostrar el flujo de matricula de inicial, primaria y secundaria.', fecha: new Date('2026-09-25'), publicado: true },
  { titulo: 'Entrega demostrativa de material educativo 2026', tituloAnterior: 'Entrega de material educativo 2025', categoria: 'MATERIALES' as const, resumen: 'Cronograma ficticio de entrega de textos y materiales por nivel educativo.', fecha: new Date('2026-09-15'), publicado: true },
  { titulo: 'Capacitacion docente demostrativa: evaluacion por competencias', tituloAnterior: 'Capacitacion docente: evaluacion por competencias', categoria: 'CAPACITACION' as const, resumen: 'Jornadas ficticias de capacitacion docente para presentar la seccion de comunicados.', fecha: new Date('2026-09-10'), publicado: true },
  { titulo: 'Mantenimiento demostrativo de locales escolares 2026', tituloAnterior: 'Mantenimiento de locales escolares', categoria: 'SERVICIO' as const, resumen: 'Cronograma ficticio de mantenimiento preventivo para locales escolares priorizados.', fecha: new Date('2026-09-01'), publicado: false },
];

function validarDatosDemo(): void {
  const errores: string[] = [];
  const codigosIe = new Set(INSTITUCIONES.map((ie) => ie.codigoModular));
  const codigosLocales = new Set(LOCALES.map((local) => local.codigoLocal));
  const localidadPorIe = new Map(LOCALES.map((local) => [local.codigoModular, local]));
  const vacantesIe = new Map<string, number>();
  const clavesVacantes = new Set<string>();
  const clavesPlazas = new Set<string>();
  const titulosComunicados = new Set<string>();

  if (codigosIe.size !== INSTITUCIONES.length) errores.push('Hay codigos modulares de IE duplicados.');
  if (codigosLocales.size !== LOCALES.length) errores.push('Hay codigos de local duplicados.');
  if (new Set(LOCALES.map((local) => local.codigoModular)).size !== LOCALES.length) {
    errores.push('Cada local de demo debe corresponder a una sola IE.');
  }

  for (const ie of INSTITUCIONES) {
    if (!UGELES.some((ugel) => ugel.codigo === ie.ugel)) {
      errores.push(`La IE ${ie.codigoModular} referencia una UGEL inexistente.`);
    }
    if (!DISTRITOS.some((distrito) => distrito.codigo === ie.distrito)) {
      errores.push(`La IE ${ie.codigoModular} referencia un distrito inexistente.`);
    }
  }

  for (const vacante of VACANTES) {
    const clave = `${vacante.codigoModular}:${vacante.nivel}:${vacante.turno}`;
    const local = localidadPorIe.get(vacante.codigoModular);
    const ie = INSTITUCIONES.find((item) => item.codigoModular === vacante.codigoModular);
    if (!codigosIe.has(vacante.codigoModular)) errores.push(`Vacante con IE inexistente: ${vacante.codigoModular}.`);
    if (ie && ie.nivel !== vacante.nivel) errores.push(`El nivel de la vacante ${clave} no coincide con el nivel de la IE.`);
    if (clavesVacantes.has(clave)) errores.push(`Vacante duplicada: ${clave}.`);
    clavesVacantes.add(clave);
    if (!Number.isInteger(vacante.cupoTotal) || vacante.cupoTotal < 0
      || !Number.isInteger(vacante.cupoDisponibles) || vacante.cupoDisponibles < 0
      || vacante.cupoDisponibles > vacante.cupoTotal) {
      errores.push(`Cupos invalidos para ${clave}.`);
    }
    if (vacante.estado === 'LIBRE' && vacante.cupoDisponibles === 0) {
      errores.push(`La vacante ${clave} esta LIBRE pero no tiene cupos disponibles.`);
    }
    if (vacante.estado !== 'LIBRE' && vacante.cupoDisponibles !== 0) {
      errores.push(`La vacante ${clave} no esta LIBRE pero conserva cupos disponibles.`);
    }
    const capacidadVacantes = (vacantesIe.get(vacante.codigoModular) ?? 0) + vacante.cupoTotal;
    vacantesIe.set(vacante.codigoModular, capacidadVacantes);
    if (local && capacidadVacantes > local.capacidadAlumnos) {
      errores.push(`La capacidad total de vacantes de ${vacante.codigoModular} supera la capacidad del local.`);
    }
    if (vacante.fechaLimite && Number.isNaN(vacante.fechaLimite.getTime())) {
      errores.push(`Fecha limite invalida para ${clave}.`);
    }
  }

  for (const local of LOCALES) {
    if (!codigosIe.has(local.codigoModular)) errores.push(`Local ${local.codigoLocal} referencia una IE inexistente.`);
    if (local.aulasOperativas > local.aulasTotales || local.aulasOperativas < 0) {
      errores.push(`Aulas invalidas para el local ${local.codigoLocal}.`);
    }
    if (local.avanceObras !== undefined && (local.avanceObras < 0 || local.avanceObras > 100)) {
      errores.push(`Avance de obras invalido para el local ${local.codigoLocal}.`);
    }
  }

  for (const plaza of PLAZAS) {
    const clave = `${plaza.codigoModular}:${plaza.cargo}:${plaza.area}`;
    const ie = INSTITUCIONES.find((item) => item.codigoModular === plaza.codigoModular);
    if (!codigosIe.has(plaza.codigoModular)) errores.push(`Plaza con IE inexistente: ${plaza.codigoModular}.`);
    if (ie && ie.nivel !== plaza.nivel) errores.push(`El nivel de la plaza ${clave} no coincide con el nivel de la IE.`);
    if (plaza.numeroRD !== NUMERO_RD_DEMO) errores.push(`Plaza con convocatoria no demostrativa: ${clave}.`);
    if (clavesPlazas.has(clave)) errores.push(`Plaza duplicada: ${clave}.`);
    clavesPlazas.add(clave);
  }

  for (const alerta of ALERTAS) {
    const local = LOCALES.find((item) => item.codigoLocal === alerta.codigoLocal);
    if (!local) errores.push(`Alerta con local inexistente: ${alerta.codigoLocal}.`);
    if (local?.codigoModular !== alerta.codigoModular) {
      errores.push(`La alerta del local ${alerta.codigoLocal} referencia otra IE.`);
    }
  }

  for (const comunicado of COMUNICADOS) {
    if (titulosComunicados.has(comunicado.titulo)) errores.push(`Comunicado duplicado: ${comunicado.titulo}.`);
    titulosComunicados.add(comunicado.titulo);
  }

  if (errores.length > 0) {
    throw new Error(`Dataset demostrativo inconsistente:\n- ${errores.join('\n- ')}`);
  }
}

async function prepararMigracionVacanteAnterior(): Promise<number | null> {
  const ieAnterior = await prisma.institucionEducativa.findUnique({
    where: { codigoModular: '1580001' },
  });
  const ieDestino = await prisma.institucionEducativa.findUnique({
    where: { codigoModular: '1580002' },
  });
  if (!ieAnterior || !ieDestino) return null;

  const vacanteAnterior = await prisma.vacanteMatricula.findFirst({
    where: { ieId: ieAnterior.id, nivel: 'PRIMARIA', turno: 'MANANA' },
  });
  if (!vacanteAnterior) return null;
  if (
    vacanteAnterior.cupoTotal !== 280
    || vacanteAnterior.cupoDisponibles !== 0
    || vacanteAnterior.estado !== 'COMPLETO'
  ) {
    throw new Error(
      'Se encontro una vacante de primaria en la IE 1580001 que no coincide con el registro anterior del seed; requiere revision manual.',
    );
  }

  const vacanteDestino = await prisma.vacanteMatricula.findFirst({
    where: { ieId: ieDestino.id, nivel: 'PRIMARIA', turno: 'MANANA' },
  });
  if (vacanteDestino) {
    throw new Error(
      'Existe la vacante destino de primaria en la IE 1580002 junto con el registro anterior de la IE 1580001; revisar duplicidad antes de ejecutar el seed.',
    );
  }
  return vacanteAnterior.id;
}

/* ------------------------------------------------------------------ */
/* Ejecucion                                                           */
/* ------------------------------------------------------------------ */

async function main(): Promise<void> {
  validarDatosDemo();
  const vacanteAnteriorId = await prepararMigracionVacanteAnterior();
  console.log('Iniciando seed de Educa Lambayeque...');
  console.log('AVISO: los datos de negocio son FICTICIOS (replican los mockups).');

  /* --- Catalogos --- */
  for (const u of UGELES) {
    await prisma.ugel.upsert({
      where: { codigo: u.codigo },
      update: { nombre: u.nombre },
      create: u,
    });
  }
  for (const p of PROVINCIAS) {
    await prisma.provincia.upsert({
      where: { codigo: p.codigo },
      update: { nombre: p.nombre },
      create: p,
    });
  }
  for (const d of DISTRITOS) {
    const provincia = await prisma.provincia.findUniqueOrThrow({
      where: { codigo: d.provincia },
    });
    await prisma.distrito.upsert({
      where: { codigo: d.codigo },
      update: { nombre: d.nombre, provinciaId: provincia.id },
      create: { codigo: d.codigo, nombre: d.nombre, provinciaId: provincia.id },
    });
  }
  console.log(`Catalogos OK: ${UGELES.length} UGEL, ${PROVINCIAS.length} provincias, ${DISTRITOS.length} distritos`);

  /* --- Instituciones educativas --- */
  for (const ie of INSTITUCIONES) {
    const ugel = await prisma.ugel.findUniqueOrThrow({ where: { codigo: ie.ugel } });
    const distrito = await prisma.distrito.findUniqueOrThrow({ where: { codigo: ie.distrito } });
    const provinciaId = distrito.provinciaId;

    await prisma.institucionEducativa.upsert({
      where: { codigoModular: ie.codigoModular },
      update: {
        nombre: ie.nombre,
        nivel: ie.nivel,
        turno: ie.turno,
        zona: ie.zona,
        ugelId: ugel.id,
        provinciaId,
        distritoId: distrito.id,
        telefono: ie.telefono,
        whatsapp: ie.whatsapp,
        activo: true,
      },
      create: {
        codigoModular: ie.codigoModular,
        nombre: ie.nombre,
        nivel: ie.nivel,
        turno: ie.turno,
        zona: ie.zona,
        ugelId: ugel.id,
        provinciaId,
        distritoId: distrito.id,
        telefono: ie.telefono,
        whatsapp: ie.whatsapp,
        activo: true,
      },
    });
  }
  console.log(`Instituciones OK: ${INSTITUCIONES.length}`);

  if (vacanteAnteriorId !== null) {
    const ieDestino = await prisma.institucionEducativa.findUniqueOrThrow({
      where: { codigoModular: '1580002' },
    });
    const vacanteDestino = VACANTES.find(
      (vacante) => vacante.codigoModular === '1580002'
        && vacante.nivel === 'PRIMARIA'
        && vacante.turno === 'MANANA',
    );
    if (!vacanteDestino) throw new Error('Falta la vacante destino de primaria en el seed.');
    await prisma.vacanteMatricula.update({
      where: { id: vacanteAnteriorId },
      data: {
        ieId: ieDestino.id,
        nivel: vacanteDestino.nivel,
        turno: vacanteDestino.turno,
        cupoTotal: vacanteDestino.cupoTotal,
        cupoDisponibles: vacanteDestino.cupoDisponibles,
        estado: vacanteDestino.estado,
        fechaLimite: vacanteDestino.fechaLimite ?? null,
      },
    });
    console.log('Vacante anterior de demo migrada a la IE 1580002.');
  }

  /* --- Convocatoria --- */
  const datosConvocatoria = {
    titulo: 'Convocatoria demostrativa 2026 - Plazas docentes',
    numeroRD: NUMERO_RD_DEMO,
    descripcion:
      'Registro ficticio para la demostracion funcional. Fechas y requisitos no representan una convocatoria oficial.',
    fechaInicio: new Date('2026-10-01'),
    fechaFin: new Date('2026-11-30'),
    fase: 'INSCRIPCION' as const,
    activo: true,
  };
  const convocatoriaExistente = await prisma.convocatoria.findUnique({
    where: { numeroRD: NUMERO_RD_DEMO },
  }) ?? await prisma.convocatoria.findFirst({
    where: { numeroRD: { in: [NUMERO_RD_ANTERIOR, NUMERO_RD_ANTERIOR_LEGACY] } },
  });
  const convocatoria = convocatoriaExistente
    ? await prisma.convocatoria.update({
      where: { id: convocatoriaExistente.id },
      data: datosConvocatoria,
    })
    : await prisma.convocatoria.create({ data: datosConvocatoria });
  console.log(`Convocatoria OK: ${NUMERO_RD_DEMO}`);

  /* --- Vacantes --- */
  for (const v of VACANTES) {
    const ie = await prisma.institucionEducativa.findUniqueOrThrow({
      where: { codigoModular: v.codigoModular },
    });
    // Id compuesto logico: una vacante por IE + nivel + turno.
    const existente = await prisma.vacanteMatricula.findFirst({
      where: { ieId: ie.id, nivel: v.nivel, turno: v.turno },
    });
    if (existente) {
      await prisma.vacanteMatricula.update({
        where: { id: existente.id },
        data: {
          cupoTotal: v.cupoTotal,
          cupoDisponibles: v.cupoDisponibles,
          estado: v.estado,
          fechaLimite: v.fechaLimite ?? null,
        },
      });
    } else {
      await prisma.vacanteMatricula.create({
        data: {
          ieId: ie.id,
          nivel: v.nivel,
          turno: v.turno,
          cupoTotal: v.cupoTotal,
          cupoDisponibles: v.cupoDisponibles,
          estado: v.estado,
          fechaLimite: v.fechaLimite ?? null,
        },
      });
    }
  }
  console.log(`Vacantes OK: ${VACANTES.length}`);

  /* --- Locales escolares --- */
  for (const l of LOCALES) {
    const ie = await prisma.institucionEducativa.findUniqueOrThrow({
      where: { codigoModular: l.codigoModular },
    });
    const datos = {
      ieId: ie.id,
      estado: l.estado,
      aulasOperativas: l.aulasOperativas,
      aulasTotales: l.aulasTotales,
      agua: l.agua,
      luz: l.luz,
      fibra: l.fibra,
      capacidadAlumnos: l.capacidadAlumnos,
      avanceObras: l.avanceObras ?? null,
      presupuesto: l.presupuesto ?? null,
    };
    await prisma.localEscolar.upsert({
      where: { codigoLocal: l.codigoLocal },
      update: datos,
      create: { codigoLocal: l.codigoLocal, ...datos },
    });
  }
  console.log(`Locales OK: ${LOCALES.length}`);

  /* --- Plazas docentes --- */
  for (const p of PLAZAS) {
    const ie = await prisma.institucionEducativa.findUniqueOrThrow({
      where: { codigoModular: p.codigoModular },
    });
    const existente = await prisma.plazaDocente.findFirst({
      where: {
        ieId: ie.id,
        convocatoriaId: convocatoria.id,
        cargo: p.cargo,
        area: p.area,
      },
    });
    const datos = {
      ieId: ie.id,
      convocatoriaId: convocatoria.id,
      cargo: p.cargo,
      area: p.area,
      nivel: p.nivel,
      jornada: p.jornada,
      zona: p.zona,
      turno: p.turno,
      tipo: p.tipo,
      cantidad: p.cantidad,
      estado: p.estado,
    };
    if (existente) {
      await prisma.plazaDocente.update({ where: { id: existente.id }, data: datos });
    } else {
      await prisma.plazaDocente.create({ data: datos });
    }
  }
  console.log(`Plazas OK: ${PLAZAS.length}`);

  /* --- Alertas ciudadanas --- */
  for (const a of ALERTAS) {
    const ie = await prisma.institucionEducativa.findUniqueOrThrow({
      where: { codigoModular: a.codigoModular },
    });
    const local = await prisma.localEscolar.findUniqueOrThrow({
      where: { codigoLocal: a.codigoLocal },
    });
    const existente = await prisma.alertaCiudadana.findFirst({
      where: { localEscolarId: local.id, tipo: a.tipo, reportadoPor: a.reportadoPor },
    });
    const datos = {
      localEscolarId: local.id,
      ieId: ie.id,
      tipo: a.tipo,
      descripcion: a.descripcion,
      reportadoPor: a.reportadoPor,
      telefonoReporte: a.telefonoReporte,
      estado: a.estado,
      observacion: a.observacion ?? null,
      resueltoEn: a.estado === 'RESUELTA' ? new Date('2026-10-20') : null,
    };
    if (existente) {
      await prisma.alertaCiudadana.update({ where: { id: existente.id }, data: datos });
    } else {
      await prisma.alertaCiudadana.create({ data: datos });
    }
  }
  console.log(`Alertas OK: ${ALERTAS.length}`);

  /* --- Comunicados --- */
  for (const c of COMUNICADOS) {
    const { tituloAnterior, ...datosComunicado } = c;
    const existente = await prisma.comunicado.findFirst({
      where: {
        OR: [
          { titulo: c.titulo },
          ...(tituloAnterior ? [{ titulo: tituloAnterior }] : []),
        ],
      },
    });
    if (existente) {
      await prisma.comunicado.update({ where: { id: existente.id }, data: datosComunicado });
    } else {
      await prisma.comunicado.create({ data: datosComunicado });
    }
  }
  console.log(`Comunicados OK: ${COMUNICADOS.length}`);

  /* --- Usuarios (credenciales de prueba) --- */
  const passwordHash = await bcrypt.hash('Educa2025!', 10);

  const USUARIOS = [
    {
      nombre: 'Administrador GRED',
      email: 'admin@gredlambayeque.gob.pe',
      rol: 'ADMIN_GRED' as const,
      ugelId: null,
    },
    {
      nombre: 'Editor UGEL Chiclayo',
      email: 'editor.chiclayo@gredlambayeque.gob.pe',
      rol: 'EDITOR_UGEL' as const,
      ugelId: (
        await prisma.ugel.findUniqueOrThrow({ where: { codigo: 'UGEL-LAM-02' } })
      ).id,
    },
    {
      nombre: 'Consultor Regional',
      email: 'consultor@gredlambayeque.gob.pe',
      rol: 'CONSULTOR' as const,
      ugelId: null,
    },
  ];

  for (const u of USUARIOS) {
    await prisma.usuario.upsert({
      where: { email: u.email },
      update: { nombre: u.nombre, rol: u.rol, ugelId: u.ugelId, activo: true },
      create: { ...u, passwordHash, activo: true },
    });
  }
  console.log(`Usuarios OK: ${USUARIOS.length} (password: Educa2025!)`);

  console.log('\nSeed completado.');
  console.log('Credenciales de prueba:');
  console.log('  admin@gredlambayeque.gob.pe    / Educa2025!  (ADMIN_GRED)');
  console.log('  editor.chiclayo@gredlambayeque.gob.pe / Educa2025!  (EDITOR_UGEL)');
  console.log('  consultor@gredlambayeque.gob.pe / Educa2025!  (CONSULTOR)');
}

main()
  .catch((error) => {
    console.error('Seed fallo:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

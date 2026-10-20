import { prisma } from '../../config/prisma.js';
import { AppError } from '../../common/errors.js';
import { logger } from '../../common/logger.js';

import {
  filaInstitucionSchema,
  filaLocalSchema,
  filaPlazaSchema,
  type ResumenImportacion,
  type ResultadoFila,
  type TipoImportacion,
} from './importacion.schema.js';

/** Convierte un valor de celda a texto plano, tolerando null/undefined. */
function celda(valor: unknown): string {
  if (valor === null || valor === undefined) return '';
  return String(valor).trim();
}

/**
 * Importa instituciones educativas desde filas ya parseadas.
 *
 * Modo "upsert": si el codigo modular ya existe, se actualiza; si no, se
 * crea. Una fila invalida no detiene el proceso: se registra el error y se
 * sigue con la siguiente.
 */
export async function importarInstituciones(
  filas: Record<string, unknown>[],
): Promise<ResumenImportacion> {
  const detalle: ResultadoFila[] = [];
  let importadas = 0;
  let actualizadas = 0;
  let errores = 0;

  // Cache de catalogos para no consultar por fila.
  const [ugeles, provincias, distritos] = await Promise.all([
    prisma.ugel.findMany(),
    prisma.provincia.findMany(),
    prisma.distrito.findMany(),
  ]);
  const ugelPorCodigo = new Map(ugeles.map((u) => [u.codigo, u]));
  const provinciaPorCodigo = new Map(provincias.map((p) => [p.codigo, p]));
  const distritoPorCodigo = new Map(distritos.map((d) => [d.codigo, d]));

  for (const [indice, fila] of filas.entries()) {
    const numeroFila = indice + 2; // +1 por el encabezado, +1 por base 1.
    const codigoModular = celda(fila.codigoModular);

    const parseado = filaInstitucionSchema.safeParse({
      codigoModular,
      nombre: celda(fila.nombre),
      nivel: celda(fila.nivel),
      turno: celda(fila.turno),
      zona: celda(fila.zona),
      ugelCodigo: celda(fila.ugelCodigo),
      provinciaCodigo: celda(fila.provinciaCodigo),
      distritoCodigo: celda(fila.distritoCodigo),
      telefono: celda(fila.telefono),
      whatsapp: celda(fila.whatsapp),
    });

    if (!parseado.success) {
      errores += 1;
      detalle.push({
        fila: numeroFila,
        estado: 'ERROR',
        codigo: codigoModular || undefined,
        mensaje: parseado.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      });
      continue;
    }

    const d = parseado.data;
    const ugel = ugelPorCodigo.get(d.ugelCodigo);
    const provincia = provinciaPorCodigo.get(d.provinciaCodigo);
    const distrito = distritoPorCodigo.get(d.distritoCodigo);

    if (!ugel || !provincia || !distrito) {
      errores += 1;
      const faltantes = [
        !ugel ? 'UGEL' : null,
        !provincia ? 'provincia' : null,
        !distrito ? 'distrito' : null,
      ]
        .filter(Boolean)
        .join(', ');
      detalle.push({
        fila: numeroFila,
        estado: 'ERROR',
        codigo: d.codigoModular,
        mensaje: `Catalogo no encontrado: ${faltantes}`,
      });
      continue;
    }

    try {
      const existente = await prisma.institucionEducativa.findUnique({
        where: { codigoModular: d.codigoModular },
      });

      const datos = {
        nombre: d.nombre,
        nivel: d.nivel,
        turno: d.turno,
        zona: d.zona,
        ugelId: ugel.id,
        provinciaId: provincia.id,
        distritoId: distrito.id,
        telefono: d.telefono || null,
        whatsapp: d.whatsapp || null,
        activo: true,
      };

      if (existente) {
        await prisma.institucionEducativa.update({
          where: { id: existente.id },
          data: datos,
        });
        actualizadas += 1;
        detalle.push({ fila: numeroFila, estado: 'ACTUALIZADA', codigo: d.codigoModular });
      } else {
        await prisma.institucionEducativa.create({
          data: { codigoModular: d.codigoModular, ...datos },
        });
        importadas += 1;
        detalle.push({ fila: numeroFila, estado: 'IMPORTADA', codigo: d.codigoModular });
      }
    } catch (error) {
      errores += 1;
      detalle.push({
        fila: numeroFila,
        estado: 'ERROR',
        codigo: d.codigoModular,
        mensaje: error instanceof Error ? error.message : 'Error desconocido',
      });
      logger.warn('Fallo al importar institucion', { fila: numeroFila, codigo: d.codigoModular });
    }
  }

  return {
    tipo: 'INSTITUCIONES',
    total: filas.length,
    importadas,
    actualizadas,
    errores,
    detalle,
  };
}

/** Importa locales escolares, asociandolos por codigo modular de la IE. */
export async function importarLocales(filas: Record<string, unknown>[]): Promise<ResumenImportacion> {
  const detalle: ResultadoFila[] = [];
  let importadas = 0;
  let actualizadas = 0;
  let errores = 0;

  for (const [indice, fila] of filas.entries()) {
    const numeroFila = indice + 2;
    const codigoLocal = celda(fila.codigoLocal);
    const codigoModular = celda(fila.codigoModular);

    const parseado = filaLocalSchema.safeParse({
      codigoLocal,
      codigoModular,
      estado: celda(fila.estado),
      aulasOperativas: celda(fila.aulasOperativas),
      aulasTotales: celda(fila.aulasTotales),
      agua: celda(fila.agua),
      luz: celda(fila.luz).toUpperCase(),
      fibra: celda(fila.fibra).toUpperCase(),
      capacidadAlumnos: celda(fila.capacidadAlumnos),
    });

    if (!parseado.success) {
      errores += 1;
      detalle.push({
        fila: numeroFila,
        estado: 'ERROR',
        codigo: codigoLocal,
        mensaje: parseado.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      });
      continue;
    }

    const d = parseado.data;
    const ie = await prisma.institucionEducativa.findUnique({
      where: { codigoModular: d.codigoModular },
    });
    if (!ie) {
      errores += 1;
      detalle.push({
        fila: numeroFila,
        estado: 'ERROR',
        codigo: d.codigoLocal,
        mensaje: `No existe la institucion con codigo modular ${d.codigoModular}`,
      });
      continue;
    }

    try {
      const existente = await prisma.localEscolar.findUnique({
        where: { codigoLocal: d.codigoLocal },
      });
      const datos = {
        ieId: ie.id,
        estado: d.estado,
        aulasOperativas: d.aulasOperativas,
        aulasTotales: d.aulasTotales,
        agua: d.agua,
        luz: d.luz,
        fibra: d.fibra,
        capacidadAlumnos: d.capacidadAlumnos ?? null,
      };

      if (existente) {
        await prisma.localEscolar.update({ where: { id: existente.id }, data: datos });
        actualizadas += 1;
        detalle.push({ fila: numeroFila, estado: 'ACTUALIZADA', codigo: d.codigoLocal });
      } else {
        await prisma.localEscolar.create({ data: { codigoLocal: d.codigoLocal, ...datos } });
        importadas += 1;
        detalle.push({ fila: numeroFila, estado: 'IMPORTADA', codigo: d.codigoLocal });
      }
    } catch (error) {
      errores += 1;
      detalle.push({
        fila: numeroFila,
        estado: 'ERROR',
        codigo: d.codigoLocal,
        mensaje: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  return {
    tipo: 'LOCALES',
    total: filas.length,
    importadas,
    actualizadas,
    errores,
    detalle,
  };
}

/** Importa plazas docentes, asociandolas por codigo modular y numero de RD. */
export async function importarPlazas(filas: Record<string, unknown>[]): Promise<ResumenImportacion> {
  const detalle: ResultadoFila[] = [];
  let importadas = 0;
  let actualizadas = 0;
  let errores = 0;

  for (const [indice, fila] of filas.entries()) {
    const numeroFila = indice + 2;
    const codigoModular = celda(fila.codigoModular);
    const numeroRD = celda(fila.numeroRD);

    const parseado = filaPlazaSchema.safeParse({
      codigoModular,
      numeroRD,
      cargo: celda(fila.cargo),
      area: celda(fila.area),
      nivel: celda(fila.nivel),
      jornada: celda(fila.jornada),
      zona: celda(fila.zona),
      turno: celda(fila.turno),
      tipo: celda(fila.tipo),
      cantidad: celda(fila.cantidad),
    });

    if (!parseado.success) {
      errores += 1;
      detalle.push({
        fila: numeroFila,
        estado: 'ERROR',
        codigo: codigoModular,
        mensaje: parseado.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      });
      continue;
    }

    const d = parseado.data;
    const [ie, convocatoria] = await Promise.all([
      prisma.institucionEducativa.findUnique({ where: { codigoModular: d.codigoModular } }),
      prisma.convocatoria.findUnique({ where: { numeroRD: d.numeroRD } }),
    ]);

    if (!ie || !convocatoria) {
      errores += 1;
      detalle.push({
        fila: numeroFila,
        estado: 'ERROR',
        codigo: codigoModular,
        mensaje: !ie
          ? `No existe la institucion con codigo modular ${d.codigoModular}`
          : `No existe la convocatoria con R.D. ${d.numeroRD}`,
      });
      continue;
    }

    try {
      // Una plaza se identifica por el conjunto IE + convocatoria + cargo + area.
      const existente = await prisma.plazaDocente.findFirst({
        where: {
          ieId: ie.id,
          convocatoriaId: convocatoria.id,
          cargo: d.cargo,
          area: d.area,
        },
      });

      const datos = {
        ieId: ie.id,
        convocatoriaId: convocatoria.id,
        cargo: d.cargo,
        area: d.area,
        nivel: d.nivel,
        jornada: d.jornada,
        zona: d.zona,
        turno: d.turno,
        tipo: d.tipo,
        cantidad: d.cantidad,
        estado: 'ACTIVA' as const,
      };

      if (existente) {
        await prisma.plazaDocente.update({ where: { id: existente.id }, data: datos });
        actualizadas += 1;
        detalle.push({ fila: numeroFila, estado: 'ACTUALIZADA', codigo: codigoModular });
      } else {
        await prisma.plazaDocente.create({ data: datos });
        importadas += 1;
        detalle.push({ fila: numeroFila, estado: 'IMPORTADA', codigo: codigoModular });
      }
    } catch (error) {
      errores += 1;
      detalle.push({
        fila: numeroFila,
        estado: 'ERROR',
        codigo: codigoModular,
        mensaje: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  return {
    tipo: 'PLAZAS',
    total: filas.length,
    importadas,
    actualizadas,
    errores,
    detalle,
  };
}

/** Despacha la importacion segun el tipo indicado. */
export async function importar(
  tipo: TipoImportacion,
  filas: Record<string, unknown>[],
): Promise<ResumenImportacion> {
  if (!filas.length) {
    throw AppError.badRequest('El archivo no contiene filas de datos');
  }
  switch (tipo) {
    case 'INSTITUCIONES':
      return importarInstituciones(filas);
    case 'LOCALES':
      return importarLocales(filas);
    case 'PLAZAS':
      return importarPlazas(filas);
    default:
      throw AppError.badRequest(`Tipo de importacion no soportado: ${tipo}`);
  }
}

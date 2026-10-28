import { AxiosError, AxiosHeaders, type AxiosAdapter, type AxiosResponse } from 'axios';

type DemoRow = Record<string, unknown>;

interface DemoState {
  vacantes: DemoRow[];
  plazas: DemoRow[];
  convocatorias: DemoRow[];
  alertas: DemoRow[];
  locales: DemoRow[];
  comunicados: DemoRow[];
  instituciones: DemoRow[];
}

const STORAGE_KEY = 'educa.adminDemoData.v3';
const FECHA_DEMO = '2026-10-27T12:00:00.000Z';

const UGELES = [
  { id: 1, codigo: 'UGEL-LAM-01', nombre: 'UGEL Lambayeque' },
  { id: 2, codigo: 'UGEL-LAM-02', nombre: 'UGEL Chiclayo' },
  { id: 3, codigo: 'UGEL-LAM-03', nombre: 'UGEL Ferreñafe' },
  { id: 4, codigo: 'UGEL-LAM-04', nombre: 'UGEL Lambayeque Rural 1' },
];

function institucion(id: number, nombre: string, codigoModular: string, ugelId: number, distrito: string) {
  const ugel = UGELES.find((item) => item.id === ugelId);
  if (!ugel) throw new Error(`No existe la UGEL demostrativa ${ugelId}`);
  return {
    id,
    ieId: id,
    codigoModular,
    nombre,
    nivel: id === 1 ? 'PRIMARIA' : 'SECUNDARIA',
    turno: 'MANANA',
    zona: 'URBANA',
    telefono: '074-000000',
    whatsapp: '51900000000',
    ugelId: ugel.id,
    ugel,
    distrito: { id, nombre: distrito, provincia: { id: 1, nombre: id === 3 ? 'Ferreñafe' : 'Chiclayo' } },
    provincia: { id: 1, nombre: id === 3 ? 'Ferreñafe' : 'Chiclayo' },
  };
}

function createInitialState(): DemoState {
  const instituciones = [
    institucion(1, 'I.E. Demostrativa José Leonardo Ortiz', '1580001', 2, 'José Leonardo Ortiz'),
    institucion(2, 'I.E. Demostrativa Santa Victoria', '1580002', 2, 'Chiclayo'),
    institucion(3, 'I.E. Demostrativa Ferreñafe', '1580003', 3, 'Ferreñafe'),
  ];
  const convocatorias = [
    {
      id: 1, titulo: 'Convocatoria de demostración para plazas docentes', numeroRD: 'R.D. DEMO-2026-001',
      fechaInicio: '2026-10-01T00:00:00.000Z', fechaFin: '2026-12-31T23:59:59.000Z',
      fase: 'INSCRIPCION', activo: true, descripcion: 'Registro ficticio para la presentación.',
      pdfMeritosUrl: '/documentos/convocatoria-demo.pdf', _count: { plazas: 2 },
    },
    {
      id: 2, titulo: 'Proceso demostrativo de contratación docente', numeroRD: 'R.D. DEMO-2026-002',
      fechaInicio: '2026-10-15T00:00:00.000Z', fechaFin: '2026-11-30T23:59:59.000Z',
      fase: 'ADJUDICACION', activo: true, descripcion: 'Registro ficticio para la presentación.',
      pdfMeritosUrl: '/documentos/convocatoria-demo.pdf', _count: { plazas: 1 },
    },
  ];
  const locales: DemoRow[] = instituciones.map((ie, index) => ({
    id: index + 1,
    ieId: ie.id,
    codigoLocal: `L-${ie.codigoModular}`,
    estado: index === 1 ? 'ATENCION_PRIORITARIA' : 'OPERATIVO_REGULAR',
    aulasOperativas: 8 - index,
    aulasTotales: 10,
    agua: index === 1 ? 'NO_DISPONIBLE' : 'AGUA_24H',
    luz: true,
    fibra: index !== 2,
    capacidadAlumnos: 320,
    avanceObras: 0,
    presupuesto: 0,
    fichaEdanUrl: index === 1 ? '/documentos/convocatoria-demo.pdf' : null,
    fotos: index === 1 ? ['/Imagenes/Sanjose.png'] : [],
    ultimaInspeccion: FECHA_DEMO,
    ie,
    alertas: [],
    _count: { alertas: index === 1 ? 1 : 0 },
  }));
  const vacantes = [
    {
      id: 1, ieId: 1, nivel: 'PRIMARIA', turno: 'MANANA', cupoTotal: 30, cupoDisponibles: 18,
      estado: 'LIBRE', fechaLimite: '2026-12-31T23:59:59.000Z', ie: instituciones[0],
    },
    {
      id: 2, ieId: 2, nivel: 'SECUNDARIA', turno: 'TARDE', cupoTotal: 20, cupoDisponibles: 14,
      estado: 'LIBRE', fechaLimite: '2026-12-31T23:59:59.000Z', ie: instituciones[1],
    },
    {
      id: 3, ieId: 3, nivel: 'INICIAL_JARDIN', turno: 'MANANA', cupoTotal: 15, cupoDisponibles: 0,
      estado: 'COMPLETO', fechaLimite: '2026-12-31T23:59:59.000Z', ie: instituciones[2],
    },
  ];
  const plazas = [
    {
      id: 1, ieId: 1, convocatoriaId: 1, cargo: 'Docente de primaria', area: 'Educación primaria',
      nivel: 'PRIMARIA', jornada: 'JORNADA_30', zona: 'URBANA', turno: 'MANANA',
      tipo: 'ORGANICA', cantidad: 2, estado: 'CONVOCADA', ie: instituciones[0], convocatoria: convocatorias[0],
    },
    {
      id: 2, ieId: 2, convocatoriaId: 2, cargo: 'Docente de comunicación', area: 'Comunicación',
      nivel: 'SECUNDARIA', jornada: 'JORNADA_30', zona: 'URBANA', turno: 'TARDE',
      tipo: 'EVENTUAL_CUADRO', cantidad: 1, estado: 'ACTIVA', ie: instituciones[1], convocatoria: convocatorias[1],
    },
    {
      id: 3, ieId: 3, convocatoriaId: 1, cargo: 'Docente de inicial', area: 'Educación inicial',
      nivel: 'INICIAL_JARDIN', jornada: 'JORNADA_25', zona: 'RURAL_1', turno: 'MANANA',
      tipo: 'REEMPLAZO_LICENCIA', cantidad: 1, estado: 'ACTIVA', ie: instituciones[2], convocatoria: convocatorias[0],
    },
  ];
  const alertas = [
    {
      id: 1, localEscolarId: 2, ieId: 2, tipo: 'FALTA_AGUA', estado: 'ABIERTA',
      descripcion: 'Reporte demostrativo: revisar el servicio de agua del local escolar.',
      fotos: ['/Imagenes/Pedro-ruiz-gallo-eten.jpg', '/Imagenes/ieSantaRosa.jpeg'], reportadoPor: 'Usuario de demostración', telefonoReporte: null,
      observacion: null, resueltoEn: null, createdAt: FECHA_DEMO,
      ie: instituciones[1], localEscolar: locales[1],
    },
  ];
  const localPrioritario = locales.find((item) => item.id === 2);
  if (!localPrioritario) throw new Error('No existe el local escolar demostrativo');
  localPrioritario.alertas = alertas.map((item) => ({
    id: item.id, tipo: item.tipo, estado: item.estado, descripcion: item.descripcion, createdAt: item.createdAt,
  }));

  return {
    vacantes,
    plazas,
    convocatorias,
    alertas,
    locales,
    instituciones,
    comunicados: [
      {
        id: 'demo-1', titulo: 'Comunicado de ejemplo sobre el calendario escolar',
        categoria: 'Información demostrativa', resumen: 'Aviso ficticio para la presentación.',
        contenido: 'Este comunicado es ficticio y no constituye una comunicación oficial.',
        fecha: FECHA_DEMO, imagenUrl: '/Imagenes/comunicado-aula-laptop.jpg', publicado: true,
      },
      {
        id: 'demo-2', titulo: 'Orientaciones educativas de muestra',
        categoria: 'Orientación', resumen: 'Publicación de ejemplo para la comunidad educativa.',
        contenido: 'El contenido de esta publicación es ficticio.',         fecha: FECHA_DEMO, imagenUrl: '/Imagenes/comunicado-libros.jpg', publicado: true,
      },
              {
                id: 'demo-3', titulo: 'Recomendaciones para el estudio en casa',
                categoria: 'Orientación', resumen: 'Consejos de ejemplo para estudiantes y familias.',
                contenido: 'El contenido de esta publicación es ficticio.', fecha: FECHA_DEMO,
                imagenUrl: '/Imagenes/comunicado-escritorio-estudio.jpg', publicado: true,
              },
            ],
  };
}

function getState(): DemoState {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const initial = createInitialState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  const parsed: unknown = JSON.parse(stored);
  if (
    typeof parsed !== 'object'
    || parsed === null
    || !('vacantes' in parsed)
    || !('plazas' in parsed)
    || !('convocatorias' in parsed)
    || !('alertas' in parsed)
    || !('locales' in parsed)
    || !('comunicados' in parsed)
    || !('instituciones' in parsed)
  ) {
    throw new Error('Los datos locales de demostración están dañados. Borra el almacenamiento de la app y vuelve a abrirla.');
  }
  return parsed as DemoState;
}

function saveState(state: DemoState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function text(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value).toLocaleLowerCase('es-PE') : '';
}

function paginate(rows: DemoRow[], params: URLSearchParams): DemoRow[] | { data: DemoRow[]; meta: { page: number; limit: number; total: number; totalPages: number } } {
  const page = Math.max(1, Number(params.get('page') ?? 1));
  const limit = Math.max(1, Number(params.get('limit') ?? 20));
  const start = (page - 1) * limit;
  return {
    data: rows.slice(start, start + limit),
    meta: { page, limit, total: rows.length, totalPages: Math.max(1, Math.ceil(rows.length / limit)) },
  };
}

function filterRows(rows: DemoRow[], params: URLSearchParams, collection: string): DemoRow[] {
  let filtered = rows;
  const search = params.get('search')?.toLocaleLowerCase('es-PE').trim();
  if (search) {
    filtered = filtered.filter((row) => JSON.stringify(row).toLocaleLowerCase('es-PE').includes(search));
  }
  const fieldFilters: Record<string, string[]> = {
    vacantes: ['nivel', 'estado'],
    plazas: ['tipo', 'nivel', 'estado'],
    convocatorias: ['fase'],
    alertas: ['estado', 'tipo'],
    locales: ['estado'],
  };
  for (const field of fieldFilters[collection] ?? []) {
    const value = params.get(field);
    if (value) filtered = filtered.filter((row) => text(row[field]) === value.toLocaleLowerCase('es-PE'));
  }
  const ugelId = params.get('ugelId');
  if (ugelId && ['plazas', 'locales'].includes(collection)) {
    filtered = filtered.filter((row) => {
      const ie = row.ie;
      return typeof ie === 'object' && ie !== null && 'ugel' in ie
        && typeof ie.ugel === 'object' && ie.ugel !== null && 'id' in ie.ugel
        && String(ie.ugel.id) === ugelId;
    });
  }
  if (params.get('prioritario') === 'true') {
    filtered = filtered.filter((row) => row.estado === 'ATENCION_PRIORITARIA');
  }
  if (params.get('activo') === 'true') {
    filtered = filtered.filter((row) => row.activo === true);
  }
  if (params.get('publicado') === 'true') {
    filtered = filtered.filter((row) => row.publicado === true);
  }
  return filtered;
}

function withRelationships(state: DemoState): void {
  const instituciones = new Map(state.instituciones.map((ie) => [Number(ie.id), ie]));
  const convocatorias = new Map(state.convocatorias.map((item) => [Number(item.id), item]));
  const locales = new Map(state.locales.map((item) => [Number(item.id), item]));
  for (const row of state.vacantes) row.ie = instituciones.get(Number(row.ieId));
  for (const row of state.plazas) {
    row.ie = instituciones.get(Number(row.ieId));
    row.convocatoria = convocatorias.get(Number(row.convocatoriaId));
  }
  for (const row of state.locales) {
    row.ie = instituciones.get(Number(row.ieId));
    row.alertas = state.alertas
      .filter((alerta) => Number(alerta.localEscolarId) === Number(row.id))
      .map((alerta) => ({
        id: alerta.id,
        tipo: alerta.tipo,
        estado: alerta.estado,
        descripcion: alerta.descripcion,
        createdAt: alerta.createdAt,
      }));
    row._count = { alertas: Array.isArray(row.alertas) ? row.alertas.length : 0 };
  }
  for (const row of state.alertas) {
    row.ie = instituciones.get(Number(row.ieId));
    row.localEscolar = locales.get(Number(row.localEscolarId));
  }
  for (const row of state.convocatorias) {
    row._count = { plazas: state.plazas.filter((plaza) => Number(plaza.convocatoriaId) === Number(row.id)).length };
  }
}

function dashboardData(state: DemoState): DemoRow {
  const cuposPorNivel = new Map<string, { cupoTotal: number; cupoDisponibles: number }>();
  const plazasPorTipo = new Map<string, number>();
  for (const vacante of state.vacantes) {
    const nivel = String(vacante.nivel);
    const acumulado = cuposPorNivel.get(nivel) ?? { cupoTotal: 0, cupoDisponibles: 0 };
    acumulado.cupoTotal += Number(vacante.cupoTotal);
    acumulado.cupoDisponibles += Number(vacante.cupoDisponibles);
    cuposPorNivel.set(nivel, acumulado);
  }
  for (const plaza of state.plazas) {
    const tipo = String(plaza.tipo);
    plazasPorTipo.set(tipo, (plazasPorTipo.get(tipo) ?? 0) + Number(plaza.cantidad));
  }
  return {
    totales: {
      instituciones: state.instituciones.length,
      vacantes: state.vacantes.length,
      plazas: state.plazas.length,
      locales: state.locales.length,
      alertasAbiertas: state.alertas.filter((item) => item.estado === 'ABIERTA').length,
      comunicadosPublicados: state.comunicados.length,
    },
    cuposPorNivel: [...cuposPorNivel].map(([nivel, sum]) => ({
      nivel, _sum: { cupoTotal: sum.cupoTotal, cupoDisponibles: sum.cupoDisponibles },
    })),
    plazasPorTipo: [...plazasPorTipo].map(([tipo, cantidad]) => ({ tipo, _sum: { cantidad } })),
  };
}

function requestPayload(data: unknown): DemoRow {
  if (typeof data === 'string' && data) {
    const parsed: unknown = JSON.parse(data);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) return parsed as DemoRow;
  }
  if (typeof data === 'object' && data !== null && !Array.isArray(data)) return data as DemoRow;
  return {};
}

function reply(data: unknown, config: Parameters<AxiosAdapter>[0]): AxiosResponse {
  return { data, status: 200, statusText: 'OK', headers: new AxiosHeaders(), config };
}

export const demoApiAdapter: AxiosAdapter = async (config) => {
  const method = (config.method ?? 'get').toUpperCase();
  const soloConsulta =
    import.meta.env.VITE_APP_MOBILE === 'true' ||
    window.location.pathname === '/app/consulta';
  if (soloConsulta && method !== 'GET' && method !== 'HEAD') {
    const response: AxiosResponse = {
      data: { error: { codigo: 'SOLO_LECTURA', mensaje: 'La aplicación ciudadana solo permite consultar información.' } },
      status: 403,
      statusText: 'Forbidden',
      headers: new AxiosHeaders(),
      config,
    };
    throw new AxiosError('La aplicación ciudadana solo permite consultar información.', 'ERR_DEMO_READ_ONLY', config, undefined, response);
  }

  const state = getState();
  withRelationships(state);
  const url = new URL(config.url ?? '/', 'http://demo.local');
  const basePath = new URL(config.baseURL ?? '/api', 'http://demo.local').pathname.replace(/\/$/, '');
  const path = `${basePath}/${url.pathname.replace(/^\/+/, '')}`.replace(/\/+/g, '/');
  const params = new URLSearchParams(url.search);

  let data: unknown;
  if (method === 'GET' && path.endsWith('/dashboard')) {
    data = dashboardData(state);
  } else if (method === 'GET' && path.endsWith('/catalogos/ugeles')) {
    data = UGELES;
  } else if (method === 'GET' && path.endsWith('/catalogos/provincias')) {
    data = [{ id: 1, codigo: 'LAM-01', nombre: 'Lambayeque' }, { id: 2, codigo: 'LAM-02', nombre: 'Chiclayo' }, { id: 3, codigo: 'LAM-03', nombre: 'Ferreñafe' }];
  } else if (method === 'GET' && path.endsWith('/catalogos/distritos')) {
    data = state.instituciones.map((ie) => ie.distrito).filter((value, index, list) => list.findIndex((item) => JSON.stringify(item) === JSON.stringify(value)) === index);
  } else if (method === 'GET' && path.endsWith('/vacantes/resumen')) {
    data = {
      porNivel: ['INICIAL_JARDIN', 'PRIMARIA', 'SECUNDARIA', 'EBE'].map((nivel) => {
        const rows = state.vacantes.filter((item) => item.nivel === nivel);
        return { nivel, _sum: { cupoTotal: rows.reduce((sum, item) => sum + Number(item.cupoTotal), 0), cupoDisponibles: rows.reduce((sum, item) => sum + Number(item.cupoDisponibles), 0) }, _count: { _all: rows.length } };
      }),
      porEstado: ['LIBRE', 'LISTA_ESPERA', 'COMPLETO', 'CERRADO'].map((estado) => {
        const rows = state.vacantes.filter((item) => item.estado === estado);
        return { estado, _count: { _all: rows.length }, _sum: { cupoTotal: rows.reduce((sum, item) => sum + Number(item.cupoTotal), 0), cupoDisponibles: rows.reduce((sum, item) => sum + Number(item.cupoDisponibles), 0) } };
      }),
    };
  } else if (method === 'GET' && path.endsWith('/instituciones')) {
    data = paginate(filterRows(state.instituciones, params, 'instituciones'), params);
  } else if (method === 'GET' && path.endsWith('/vacantes')) {
    data = paginate(filterRows(state.vacantes, params, 'vacantes'), params);
  } else if (method === 'GET' && path.endsWith('/plazas')) {
    data = paginate(filterRows(state.plazas, params, 'plazas'), params);
  } else if (method === 'GET' && path.endsWith('/convocatorias')) {
    data = paginate(filterRows(state.convocatorias, params, 'convocatorias'), params);
  } else if (method === 'GET' && path.endsWith('/locales')) {
    data = paginate(filterRows(state.locales, params, 'locales'), params);
  } else if (method === 'GET' && path.endsWith('/alertas')) {
    data = paginate(filterRows(state.alertas, params, 'alertas'), params);
  } else if (method === 'GET' && path.endsWith('/comunicados')) {
    data = paginate(filterRows(state.comunicados, params, 'comunicados'), params);
  } else {
    const match = path.match(/\/(vacantes|plazas|convocatorias|alertas|locales)\/(\d+)(?:\/estado)?$/);
    if (method === 'POST' && match === null) {
      const collection = path.split('/').pop() as keyof DemoState;
      const rows = state[collection];
      if (!Array.isArray(rows)) throw new Error(`Endpoint de demostración POST no soportado: ${path}`);
      const created = { ...requestPayload(config.data), id: Date.now(), createdAt: FECHA_DEMO };
      rows.unshift(created);
      saveState(state);
      data = created;
    } else if (match) {
      const collection = match[1] as 'vacantes' | 'plazas' | 'convocatorias' | 'alertas' | 'locales';
      const rows = state[collection];
      const id = Number(match[2]);
      const index = rows.findIndex((row) => Number(row.id) === id);
      if (method === 'DELETE') {
        if (index >= 0) rows.splice(index, 1);
        saveState(state);
        data = { success: true };
      } else if (method === 'PUT' || method === 'PATCH') {
        if (index < 0) throw new AxiosError(`Registro de demostración no encontrado: ${path}`, 'ERR_DEMO_NOT_FOUND', config);
        const payload = requestPayload(config.data);
        rows[index] = path.endsWith('/estado')
          ? { ...rows[index], estado: payload.estado, observacion: payload.observacion, resueltoEn: payload.estado === 'RESUELTA' ? FECHA_DEMO : null }
          : { ...rows[index], ...payload };
        withRelationships(state);
        saveState(state);
        data = rows[index];
      } else {
        data = rows[index] ?? {};
      }
    } else {
      const response = reply({ error: `Endpoint de demostración no implementado: ${method} ${path}` }, config);
      throw new AxiosError(`Endpoint de demostración no implementado: ${method} ${path}`, 'ERR_DEMO_ENDPOINT', config, undefined, response);
    }
  }
  withRelationships(state);
  saveState(state);
  return reply(data, config);
};

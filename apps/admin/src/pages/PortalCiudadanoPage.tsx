import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  Download,
  FileText,
  GraduationCap,
  Menu,
  Phone,
  Search,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { VistaPreviaArchivo } from '@/components/ui/VistaPreviaArchivo';
import { api } from '@/lib/api';

interface VacanteCiudadana {
  id: number;
  nivel: string;
  turno: string;
  cupoDisponibles: number;
  fechaLimite: string | null;
  ie: {
    nombre: string;
    distrito: string;
    provincia: string;
    ugel: string;
    telefono: string | null;
    whatsapp: string | null;
  };
}

interface ConvocatoriaCiudadana {
  id: number;
  titulo: string;
  numeroRD: string;
  descripcion: string | null;
  fechaInicio: string;
  fechaFin: string;
  fase: string;
  pdfMeritosUrl: string | null;
}

interface PlazaCiudadana {
  id: number;
  cargo: string;
  area: string;
  nivel: string;
  jornada: string;
  zona: string;
  turno: string;
  tipo: string;
  cantidad: number;
  ie: {
    nombre: string;
    distrito: string;
    provincia: string;
    ugel: string;
  };
  convocatoria: {
    titulo: string;
    numeroRD: string;
    fechaInicio: string;
    fechaFin: string;
    pdfMeritosUrl: string | null;
  };
}

interface ComunicadoCiudadano {
  id: string;
  titulo: string;
  categoria: string;
  resumen: string;
  contenido: string | null;
  fecha: string;
  imagenUrl: string | null;
}

interface ResumenVacantes {
  totalCuposDisponibles: number;
}

const DATOS_DEMO = {
  resumen: { totalCuposDisponibles: 42 } satisfies ResumenVacantes,
  vacantes: [
    {
      id: 1,
      nivel: 'PRIMARIA',
      turno: 'MANANA',
      cupoDisponibles: 18,
      fechaLimite: '2026-12-31T23:59:59.000Z',
      ie: {
        nombre: 'I.E. Demostrativa José Leonardo Ortiz',
        distrito: 'José Leonardo Ortiz',
        provincia: 'Chiclayo',
        ugel: 'UGEL Chiclayo',
        telefono: null,
        whatsapp: null,
      },
    },
    {
      id: 2,
      nivel: 'SECUNDARIA',
      turno: 'TARDE',
      cupoDisponibles: 14,
      fechaLimite: '2026-12-31T23:59:59.000Z',
      ie: {
        nombre: 'I.E. Demostrativa Santa Victoria',
        distrito: 'Chiclayo',
        provincia: 'Chiclayo',
        ugel: 'UGEL Chiclayo',
        telefono: null,
        whatsapp: null,
      },
    },
    {
      id: 3,
      nivel: 'INICIAL_JARDIN',
      turno: 'MANANA',
      cupoDisponibles: 10,
      fechaLimite: '2026-12-31T23:59:59.000Z',
      ie: {
        nombre: 'I.E. Demostrativa Ferreñafe',
        distrito: 'Ferreñafe',
        provincia: 'Ferreñafe',
        ugel: 'UGEL Ferreñafe',
        telefono: null,
        whatsapp: null,
      },
    },
  ] satisfies VacanteCiudadana[],
  convocatorias: [
    {
      id: 1,
      titulo: 'Convocatoria de demostración para plazas docentes',
      numeroRD: 'R.D. DEMO-2026-001',
      descripcion: 'Información referencial para la presentación de la aplicación.',
      fechaInicio: '2026-10-01T00:00:00.000Z',
      fechaFin: '2026-12-31T23:59:59.000Z',
      fase: 'INSCRIPCION',
      pdfMeritosUrl: null,
    },
    {
      id: 2,
      titulo: 'Proceso demostrativo de contratación docente',
      numeroRD: 'R.D. DEMO-2026-002',
      descripcion: 'Registro de ejemplo; no corresponde a una convocatoria vigente.',
      fechaInicio: '2026-10-15T00:00:00.000Z',
      fechaFin: '2026-11-30T23:59:59.000Z',
      fase: 'ADJUDICACION',
      pdfMeritosUrl: null,
    },
  ] satisfies ConvocatoriaCiudadana[],
  plazas: [
    {
      id: 1,
      cargo: 'Docente de primaria',
      area: 'Educación primaria',
      nivel: 'PRIMARIA',
      jornada: 'JORNADA_30',
      zona: 'URBANA',
      turno: 'MANANA',
      tipo: 'ORGANICA',
      cantidad: 2,
      ie: {
        nombre: 'I.E. Demostrativa José Leonardo Ortiz',
        distrito: 'José Leonardo Ortiz',
        provincia: 'Chiclayo',
        ugel: 'UGEL Chiclayo',
      },
      convocatoria: {
        titulo: 'Convocatoria de demostración para plazas docentes',
        numeroRD: 'R.D. DEMO-2026-001',
        fechaInicio: '2026-10-01T00:00:00.000Z',
        fechaFin: '2026-12-31T23:59:59.000Z',
        pdfMeritosUrl: null,
      },
    },
    {
      id: 2,
      cargo: 'Docente de comunicación',
      area: 'Comunicación',
      nivel: 'SECUNDARIA',
      jornada: 'JORNADA_30',
      zona: 'URBANA',
      turno: 'TARDE',
      tipo: 'EVENTUAL_CUADRO',
      cantidad: 1,
      ie: {
        nombre: 'I.E. Demostrativa Santa Victoria',
        distrito: 'Chiclayo',
        provincia: 'Chiclayo',
        ugel: 'UGEL Chiclayo',
      },
      convocatoria: {
        titulo: 'Proceso demostrativo de contratación docente',
        numeroRD: 'R.D. DEMO-2026-002',
        fechaInicio: '2026-10-15T00:00:00.000Z',
        fechaFin: '2026-11-30T23:59:59.000Z',
        pdfMeritosUrl: null,
      },
    },
  ] satisfies PlazaCiudadana[],
  comunicados: [
    {
      id: 'demo-1',
      titulo: 'Comunicado de ejemplo sobre el calendario escolar',
      categoria: 'Información demostrativa',
      resumen: 'Aviso de muestra para enseñar cómo se presentarán las novedades educativas.',
      contenido: 'Este comunicado es ficticio y se incluye únicamente para la demostración.',
      fecha: '2026-10-25T12:00:00.000Z',
      imagenUrl: null,
    },
    {
      id: 'demo-2',
      titulo: 'Orientaciones educativas de muestra',
      categoria: 'Orientación',
      resumen: 'Ejemplo de una publicación informativa para la comunidad educativa.',
      contenido: 'El contenido de esta publicación es de demostración; no es una comunicación oficial.',
      fecha: '2026-10-20T12:00:00.000Z',
      imagenUrl: null,
    },
  ] satisfies ComunicadoCiudadano[],
};

const ETIQUETAS: Record<string, string> = {
  INICIAL_JARDIN: 'Inicial',
  PRIMARIA: 'Primaria',
  SECUNDARIA: 'Secundaria',
  EBE: 'Educación básica especial',
  MANANA: 'Mañana',
  TARDE: 'Tarde',
  MANANA_Y_TARDE: 'Mañana y tarde',
  COMPLETO: 'Jornada completa',
  CONTINUO_DIURNO: 'Continuo diurno',
  INSCRIPCION: 'Inscripción',
  ADJUDICACION: 'Adjudicación',
  CONTRATACION: 'Contratación',
  JORNADA_25: '25 horas',
  JORNADA_30: '30 horas',
  JORNADA_35: '35 horas',
  JORNADA_40: '40 horas',
  URBANA: 'Urbana',
  RURAL_1: 'Rural 1',
  RURAL_2: 'Rural 2',
  RURAL_3_EIB: 'Rural EIB',
  ORGANICA: 'Orgánica',
  EVENTUAL_CUADRO: 'Eventual por cuadro',
  REEMPLAZO_LICENCIA: 'Reemplazo por licencia',
  POR_EVALUACION: 'Por evaluación',
};

function etiqueta(valor: string): string {
  return ETIQUETAS[valor] ?? valor.replaceAll('_', ' ').toLowerCase();
}

function normalizarBusqueda(valor: string): string {
  return valor.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-PE');
}

const IMAGENES_COMUNICADOS = [
  {
    url: '/Imagenes/comunicado-aula-laptop.jpg',
    alt: 'Aula con una computadora portátil',
    fuente: 'https://www.pexels.com/photo/laptop-in-a-classroom-20432916/',
  },
  {
    url: '/Imagenes/comunicado-libros.jpg',
    alt: 'Libros organizados en estantes',
    fuente: 'https://www.pexels.com/photo/books-on-brown-wooden-shelves-8364640/',
  },
  {
    url: '/Imagenes/comunicado-escritorio-estudio.jpg',
    alt: 'Cuadernos y lápices sobre un escritorio de estudio',
    fuente: 'https://www.pexels.com/photo/cozy-study-desk-with-notebooks-and-pens-36048039/',
  },
] as const;

const LIMITE_VISTA_PREVIA = 4;

const FOTOS_INSTITUCIONES = [
  {
    termino: 'san jose',
    url: '/Imagenes/Sanjose.png',
    alt: 'Fachada del Colegio Nacional San José de Chiclayo',
  },
  {
    termino: 'pedro ruiz gallo',
    url: '/Imagenes/Pedro-ruiz-gallo-eten.jpg',
    alt: 'Fachada de la I.E. Pedro Ruiz Gallo de Ciudad Eten',
  },
  {
    termino: 'andres avelino',
    url: '/Imagenes/andres-avelino.jpg',
    alt: 'Fachada de la I.E. Andrés Avelino Cáceres',
  },
  {
    termino: 'santa rosa',
    url: '/Imagenes/ieSantaRosa.jpeg',
    alt: 'Fachada de la I.E. Santa Rosa',
  },
] as const;

function fotoInstitucion(nombre: string) {
  const nombreNormalizado = normalizarBusqueda(nombre);
  return FOTOS_INSTITUCIONES.find((foto) => nombreNormalizado.includes(foto.termino)) ?? null;
}

// En la vista previa se muestran primero los registros con imagen o documento.
function conPrioridad<T>(items: T[], tiene: (item: T) => boolean): T[] {
  return [...items.filter(tiene), ...items.filter((item) => !tiene(item))];
}

function imagenIlustrativaComunicado(categoria: string, titulo: string, indice: number) {
  const texto = normalizarBusqueda(`${categoria} ${titulo}`);
  if (/capacit|taller|docente|aula|digital|virtual|tecnolog/.test(texto)) {
    return IMAGENES_COMUNICADOS[0];
  }
  if (/material|libro|lectura|bibliotec/.test(texto)) {
    return IMAGENES_COMUNICADOS[1];
  }
  if (/convocatoria|norma|resolucion|inscripcion|proceso/.test(texto)) {
    return IMAGENES_COMUNICADOS[2];
  }
  return IMAGENES_COMUNICADOS[indice % IMAGENES_COMUNICADOS.length] ?? IMAGENES_COMUNICADOS[0];
}

function fecha(valor: string): string {
  const parsed = new Date(valor);
  return Number.isNaN(parsed.getTime())
    ? 'Fecha no disponible'
    : parsed.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
}

function ErrorConsulta({ reintentar }: { reintentar: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-error/30 bg-error-container p-4 text-sm text-on-error-container">
      No se pudo cargar esta información.{' '}
      <button type="button" onClick={reintentar} className="font-semibold underline">
        Reintentar
      </button>
    </div>
  );
}

export function PortalCiudadanoPage({
  modoAplicacion = false,
  modoPresentacion = false,
  modoDemostracion = false,
}: {
  modoAplicacion?: boolean;
  modoPresentacion?: boolean;
  modoDemostracion?: boolean;
}) {
  const esDemostracion =
    modoDemostracion || import.meta.env.VITE_APP_DEMO === 'true';
  const [busqueda, setBusqueda] = useState('');
  const [busquedaPlazas, setBusquedaPlazas] = useState('');
  const [nivelPlaza, setNivelPlaza] = useState('');
  const [busquedaConvocatoria, setBusquedaConvocatoria] = useState('');
  const [faseConvocatoria, setFaseConvocatoria] = useState('');
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [mostrarAnuncioDescarga, setMostrarAnuncioDescarga] = useState(false);
  const anuncioDescargaRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (mostrarAnuncioDescarga) {
      anuncioDescargaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      anuncioDescargaRef.current?.focus({ preventScroll: true });
    }
  }, [mostrarAnuncioDescarga]);

  const resumenVacantes = useQuery({
    queryKey: ['publico', 'vacantes-resumen'],
    queryFn: async () => {
      if (esDemostracion) return DATOS_DEMO.resumen;
      const { data } = await api.get<ResumenVacantes>('/public/vacantes');
      return data;
    },
    staleTime: esDemostracion ? Infinity : undefined,
  });
  const vacantes = useQuery({
    queryKey: ['publico', 'vacantes'],
    queryFn: async () => {
      if (esDemostracion) return DATOS_DEMO.vacantes;
      const { data } = await api.get<VacanteCiudadana[]>('/public/vacantes/listado');
      return data;
    },
    staleTime: esDemostracion ? Infinity : undefined,
  });
  const convocatorias = useQuery({
    queryKey: ['publico', 'convocatorias'],
    queryFn: async () => {
      if (esDemostracion) return DATOS_DEMO.convocatorias;
      const { data } = await api.get<ConvocatoriaCiudadana[]>('/public/convocatorias');
      return data;
    },
    staleTime: esDemostracion ? Infinity : undefined,
  });
  const plazas = useQuery({
    queryKey: ['publico', 'plazas'],
    queryFn: async () => {
      if (esDemostracion) return DATOS_DEMO.plazas;
      const { data } = await api.get<PlazaCiudadana[]>('/public/plazas?limite=50');
      return data;
    },
    staleTime: esDemostracion ? Infinity : undefined,
  });
  const comunicados = useQuery({
    queryKey: ['publico', 'comunicados'],
    queryFn: async () => {
      if (esDemostracion) return DATOS_DEMO.comunicados;
      const { data } = await api.get<ComunicadoCiudadano[]>('/public/comunicados?limite=6');
      return data;
    },
    staleTime: esDemostracion ? Infinity : undefined,
  });

  const vacantesFiltradas = useMemo(() => {
    const query = normalizarBusqueda(busqueda);
    return (vacantes.data ?? []).filter((vacante) =>
      [vacante.ie.nombre, vacante.ie.distrito, vacante.ie.provincia, vacante.ie.ugel]
        .join(' ')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('es-PE')
        .includes(query),
    );
  }, [busqueda, vacantes.data]);

  const plazasFiltradas = useMemo(() => {
    const query = normalizarBusqueda(busquedaPlazas);
    return (plazas.data ?? []).filter((plaza) => {
      const coincideTexto = [
        plaza.cargo,
        plaza.area,
        plaza.ie.nombre,
        plaza.ie.distrito,
        plaza.ie.provincia,
        plaza.ie.ugel,
        plaza.convocatoria.titulo,
        plaza.convocatoria.numeroRD,
      ]
        .join(' ')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('es-PE')
        .includes(query);
      return coincideTexto && (!nivelPlaza || plaza.nivel === nivelPlaza);
    });
  }, [busquedaPlazas, nivelPlaza, plazas.data]);

  const convocatoriasFiltradas = useMemo(() => {
    const query = normalizarBusqueda(busquedaConvocatoria);
    return (convocatorias.data ?? []).filter((convocatoria) => {
      const coincideTexto = [
        convocatoria.titulo,
        convocatoria.numeroRD,
        convocatoria.descripcion ?? '',
      ]
        .join(' ')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('es-PE')
        .includes(query);
      return coincideTexto && (!faseConvocatoria || convocatoria.fase === faseConvocatoria);
    });
  }, [busquedaConvocatoria, convocatorias.data, faseConvocatoria]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-outline-variant bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-4 sm:gap-4 sm:px-6 lg:px-8">
          <a href="#" className="flex min-w-0 items-center gap-2 font-bold leading-tight text-primary">
            <img
              src="/Imagenes/GORE.png"
              alt="Logotipo del Gobierno Regional de Lambayeque"
              className="h-9 w-9 shrink-0 object-contain sm:h-11 sm:w-11"
            />
            <span className="min-w-0 text-sm sm:text-base">
              Educa Lambayeque
              <span className="block text-xs font-medium text-on-surface-variant">
                {modoPresentacion ? 'Simulación de app móvil' : modoAplicacion ? 'Aplicación ciudadana' : 'Portal ciudadano'}
              </span>
            </span>
          </a>
          <nav aria-label="Navegación principal" className="hidden items-center gap-5 text-sm font-semibold text-on-surface-variant lg:flex">
            <a href="#vacantes" className="hover:text-primary">Vacantes</a>
            <a href="#plazas" className="hover:text-primary">Plazas docentes</a>
            <a href="#convocatorias" className="hover:text-primary">Convocatorias</a>
            <a href="#comunicados" className="hover:text-primary">Comunicados</a>
          </nav>
          {modoPresentacion ? (
            <Link to="/" className="rounded-lg border border-outline-variant px-3 py-2 text-sm font-semibold text-primary hover:bg-surface-container-low">
              Volver a la web
            </Link>
          ) : modoAplicacion ? null : (
            <Link to="/descargar" className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-2.5 py-2 text-xs font-semibold text-white hover:bg-primary-container sm:gap-2 sm:px-3 sm:text-sm">
              <Download size={16} />
              <span className="sm:hidden">Descargar app</span>
              <span className="hidden sm:inline">Descargar aplicación</span>
            </Link>
          )}
          <button
            type="button"
            onClick={() => setMenuMovilAbierto((abierto) => !abierto)}
            aria-label={menuMovilAbierto ? 'Cerrar navegación' : 'Abrir navegación'}
            aria-expanded={menuMovilAbierto}
            className="rounded-lg border border-outline-variant p-2 text-primary hover:bg-surface-container-low lg:hidden"
          >
            {menuMovilAbierto ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {menuMovilAbierto && (
          <nav aria-label="Navegación móvil" className="space-y-1 border-t border-outline-variant bg-white px-4 py-3 lg:hidden">
            {[
              ['#vacantes', 'Vacantes'],
              ['#plazas', 'Plazas docentes'],
              ['#convocatorias', 'Convocatorias'],
              ['#comunicados', 'Comunicados'],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                onClick={() => setMenuMovilAbierto(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
              >
                {label}
              </a>
            ))}
          </nav>
        )}
      </header>

      {esDemostracion && (
        <div className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-900 sm:text-sm">
          Modo demostración: los registros son ficticios y no provienen de la API.
        </div>
      )}

      <main>
        <section
          className="bg-[#813019] bg-cover bg-center text-white"
          style={{
            backgroundImage:
              'linear-gradient(90deg, rgba(75, 24, 15, 0.96) 0%, rgba(92, 33, 19, 0.88) 55%, rgba(74, 26, 16, 0.76) 100%), url("/Imagenes/GoreUbigeo.jpg")',
          }}
        >
          <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.4fr_0.6fr] lg:px-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-white/75">Gerencia Regional de Educación</p>
              <h1 className="mt-3 max-w-3xl text-3xl font-bold leading-tight sm:text-5xl">
                Información educativa de Lambayeque, al alcance de todos.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
                Consulta oportunidades de matrícula, plazas docentes, convocatorias y comunicados oficiales desde un solo lugar.
              </p>
              <a href="#servicios" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 font-semibold text-primary hover:bg-[#fff1ec]">
                Explorar servicios <ArrowRight size={18} />
              </a>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-6">
              <GraduationCap size={32} aria-hidden="true" />
              <p className="mt-4 text-sm font-semibold text-white/75">Cupos disponibles reportados</p>
              {resumenVacantes.isError ? (
                <button type="button" onClick={() => void resumenVacantes.refetch()} className="mt-2 text-sm underline">
                  No se pudo cargar el total. Reintentar
                </button>
              ) : (
                <p className="mt-1 text-4xl font-bold">
                  {resumenVacantes.isLoading ? '…' : resumenVacantes.data?.totalCuposDisponibles ?? 0}
                </p>
              )}
              <a href="#vacantes" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold hover:underline">
                Buscar vacantes <ArrowRight size={15} />
              </a>
            </div>
          </div>
        </section>

        <section id="servicios" className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4 sm:px-6 lg:px-8">
          <a href="#vacantes" className="rounded-xl border border-outline-variant bg-white p-5 transition hover:-translate-y-0.5 hover:border-primary">
            <GraduationCap className="text-primary" size={24} />
            <h2 className="mt-3 font-semibold">Vacantes de matrícula</h2>
            <p className="mt-1 text-sm text-on-surface-variant">Busca cupos disponibles por institución y ubicación.</p>
          </a>
          <a href="#plazas" className="rounded-xl border border-outline-variant bg-white p-5 transition hover:-translate-y-0.5 hover:border-primary">
            <BriefcaseBusiness className="text-primary" size={24} />
            <h2 className="mt-3 font-semibold">Plazas docentes</h2>
            <p className="mt-1 text-sm text-on-surface-variant">Consulta plazas convocadas y sus requisitos.</p>
          </a>
          <a href="#convocatorias" className="rounded-xl border border-outline-variant bg-white p-5 transition hover:-translate-y-0.5 hover:border-primary">
            <FileText className="text-primary" size={24} />
            <h2 className="mt-3 font-semibold">Convocatorias docentes</h2>
            <p className="mt-1 text-sm text-on-surface-variant">Revisa fases, fechas y documentos publicados.</p>
          </a>
          <a href="#comunicados" className="rounded-xl border border-outline-variant bg-white p-5 transition hover:-translate-y-0.5 hover:border-primary">
            <BookOpen className="text-primary" size={24} />
            <h2 className="mt-3 font-semibold">Comunicados</h2>
            <p className="mt-1 text-sm text-on-surface-variant">Mantente al día con la información de la GRED.</p>
          </a>
        </section>

        <section id="vacantes" className="scroll-mt-6 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-primary">Matrícula</p>
                <h2 className="mt-1 text-2xl font-bold">Vacantes disponibles</h2>
                <p className="mt-1 text-sm text-on-surface-variant">Consulta cupos por institución educativa.</p>
              </div>
              <label className="relative w-full sm:max-w-xs">
                <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="search"
                  value={busqueda}
                  onChange={(evento) => setBusqueda(evento.target.value)}
                  placeholder="Buscar institución o distrito"
                  aria-label="Buscar vacantes por institución o distrito"
                  className="h-11 w-full rounded-lg border border-outline-variant bg-white pl-9 pr-3 text-sm outline-none focus:border-primary"
                />
              </label>
            </div>
            {vacantes.isError && <div className="mt-5"><ErrorConsulta reintentar={() => void vacantes.refetch()} /></div>}
            {vacantes.isLoading ? (
              <p className="py-10 text-center text-sm text-on-surface-variant">Cargando vacantes...</p>
            ) : vacantes.data?.length === 0 ? (
              <p className="mt-5 rounded-xl border border-outline-variant p-6 text-center text-sm text-on-surface-variant">
                No hay vacantes publicadas en este momento.
              </p>
            ) : vacantesFiltradas.length === 0 ? (
              <p className="mt-5 rounded-xl border border-outline-variant p-6 text-center text-sm text-on-surface-variant">
                No se encontraron instituciones para esa búsqueda.
              </p>
            ) : (
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {conPrioridad(vacantesFiltradas, (v) => fotoInstitucion(v.ie.nombre) !== null).slice(0, LIMITE_VISTA_PREVIA).map((vacante) => {
                  const foto = fotoInstitucion(vacante.ie.nombre);
                  return (
                    <article key={vacante.id} className="rounded-xl border border-outline-variant p-5">
                      {foto && <img src={foto.url} alt={foto.alt} loading="lazy" className="mb-4 h-40 w-full rounded-lg object-cover" />}
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary">{etiqueta(vacante.nivel)} · {etiqueta(vacante.turno)}</p>
                      <h3 className="mt-2 font-semibold">{vacante.ie.nombre}</h3>
                      <p className="mt-1 text-sm text-on-surface-variant">{vacante.ie.distrito}, {vacante.ie.provincia}</p>
                      <p className="mt-3 text-sm text-on-surface-variant">{vacante.ie.ugel}</p>
                      {(vacante.ie.telefono || vacante.ie.whatsapp) && (
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 border-t border-outline-variant pt-3">
                          {vacante.ie.telefono && (
                            <a
                              href={`tel:${vacante.ie.telefono}`}
                              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                            >
                              <Phone size={15} /> {vacante.ie.telefono}
                            </a>
                          )}
                          {vacante.ie.whatsapp && (
                            <a
                              href={`https://wa.me/${vacante.ie.whatsapp.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm font-semibold text-primary hover:underline"
                            >
                              WhatsApp
                            </a>
                          )}
                        </div>
                      )}
                      <p className="mt-4 text-2xl font-bold text-primary">{vacante.cupoDisponibles} <span className="text-sm font-medium">cupos</span></p>
                      {vacante.fechaLimite && <p className="mt-1 text-xs text-on-surface-variant">Hasta {fecha(vacante.fechaLimite)}</p>}
                    </article>
                  );
                })}
              </div>
            )}
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setMostrarAnuncioDescarga(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-primary px-5 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white"
              >
                Ver más <ArrowRight size={17} aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>

        <section id="plazas" className="scroll-mt-6 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-primary">Oportunidades laborales</p>
                <h2 className="mt-1 text-2xl font-bold">Plazas docentes disponibles</h2>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Plazas activas o convocadas dentro de convocatorias vigentes.
                </p>
              </div>
              <div className="grid w-full gap-3 sm:grid-cols-[minmax(0,1fr)_12rem] md:max-w-xl">
                <label className="relative">
                  <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                  <input
                    type="search"
                    value={busquedaPlazas}
                    onChange={(evento) => setBusquedaPlazas(evento.target.value)}
                    placeholder="Cargo, área, institución o distrito"
                    aria-label="Buscar plazas docentes"
                    className="h-11 w-full rounded-lg border border-outline-variant bg-white pl-9 pr-3 text-sm outline-none focus:border-primary"
                  />
                </label>
                <select
                  value={nivelPlaza}
                  onChange={(evento) => setNivelPlaza(evento.target.value)}
                  aria-label="Filtrar plazas por nivel educativo"
                  className="h-11 w-full rounded-lg border border-outline-variant bg-white px-3 text-sm outline-none focus:border-primary"
                >
                  <option value="">Todos los niveles</option>
                  {['INICIAL_JARDIN', 'PRIMARIA', 'SECUNDARIA', 'EBE'].map((nivel) => (
                    <option key={nivel} value={nivel}>{etiqueta(nivel)}</option>
                  ))}
                </select>
              </div>
            </div>
            {!plazas.isLoading && !plazas.isError && (
              <p className="mt-3 text-xs text-on-surface-variant" aria-live="polite">
                {plazasFiltradas.length} {plazasFiltradas.length === 1 ? 'resultado' : 'resultados'}
              </p>
            )}
            {plazas.isError && <div className="mt-5"><ErrorConsulta reintentar={() => void plazas.refetch()} /></div>}
            {plazas.isLoading ? (
              <p className="py-10 text-center text-sm text-on-surface-variant">Cargando plazas docentes...</p>
            ) : plazas.data?.length === 0 ? (
              <p className="mt-5 rounded-xl border border-outline-variant p-6 text-center text-sm text-on-surface-variant">
                No hay plazas docentes vigentes para consulta.
              </p>
            ) : plazasFiltradas.length === 0 ? (
              <p className="mt-5 rounded-xl border border-outline-variant p-6 text-center text-sm text-on-surface-variant">
                No se encontraron plazas con esos criterios. Prueba con otra búsqueda o nivel.
              </p>
            ) : (
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {conPrioridad(plazasFiltradas, (p) => fotoInstitucion(p.ie.nombre) !== null).slice(0, LIMITE_VISTA_PREVIA).map((plaza) => {
                  const foto = fotoInstitucion(plaza.ie.nombre);
                  return (
                    <article key={plaza.id} className="rounded-xl border border-outline-variant p-5">
                      {foto && <img src={foto.url} alt={foto.alt} loading="lazy" className="mb-4 h-40 w-full rounded-lg object-cover" />}
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                        {etiqueta(plaza.tipo)} · {etiqueta(plaza.nivel)}
                      </p>
                      <h3 className="mt-2 font-semibold">{plaza.cargo} · {plaza.area}</h3>
                      <p className="mt-1 text-sm text-on-surface-variant">{plaza.ie.nombre}</p>
                      <p className="mt-1 text-sm text-on-surface-variant">
                        {plaza.ie.distrito}, {plaza.ie.provincia} · {plaza.ie.ugel}
                      </p>
                      <dl className="mt-4 grid grid-cols-2 gap-2 text-xs text-on-surface-variant">
                        <div><dt className="font-semibold text-on-surface">Cantidad</dt><dd>{plaza.cantidad}</dd></div>
                        <div><dt className="font-semibold text-on-surface">Jornada</dt><dd>{etiqueta(plaza.jornada)}</dd></div>
                        <div><dt className="font-semibold text-on-surface">Turno</dt><dd>{etiqueta(plaza.turno)}</dd></div>
                        <div><dt className="font-semibold text-on-surface">Zona</dt><dd>{etiqueta(plaza.zona)}</dd></div>
                      </dl>
                      <div className="mt-4 border-t border-outline-variant pt-3">
                        <p className="text-xs font-semibold text-primary">{plaza.convocatoria.titulo}</p>
                        <p className="mt-1 text-xs text-on-surface-variant">
                          {plaza.convocatoria.numeroRD} · Hasta {fecha(plaza.convocatoria.fechaFin)}
                        </p>
                        {plaza.convocatoria.pdfMeritosUrl && (
                          <VistaPreviaArchivo
                            url={plaza.convocatoria.pdfMeritosUrl}
                            titulo={`Bases: ${plaza.convocatoria.titulo}`}
                            tipo="documento"
                          >
                            <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                              <FileText size={15} /> Ver bases
                            </span>
                          </VistaPreviaArchivo>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setMostrarAnuncioDescarga(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-primary px-5 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white"
              >
                Ver más <ArrowRight size={17} aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>

        <section id="convocatorias" className="mx-auto max-w-7xl scroll-mt-6 px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">Oportunidades laborales</p>
              <h2 className="mt-1 text-2xl font-bold">Convocatorias vigentes</h2>
            </div>
            <div className="grid w-full gap-3 sm:grid-cols-[minmax(0,1fr)_12rem] md:max-w-xl">
              <label className="relative">
                <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="search"
                  value={busquedaConvocatoria}
                  onChange={(evento) => setBusquedaConvocatoria(evento.target.value)}
                  placeholder="Título, resolución o descripción"
                  aria-label="Buscar convocatorias"
                  className="h-11 w-full rounded-lg border border-outline-variant bg-white pl-9 pr-3 text-sm outline-none focus:border-primary"
                />
              </label>
              <select
                value={faseConvocatoria}
                onChange={(evento) => setFaseConvocatoria(evento.target.value)}
                aria-label="Filtrar convocatorias por fase"
                className="h-11 w-full rounded-lg border border-outline-variant bg-white px-3 text-sm outline-none focus:border-primary"
              >
                <option value="">Todas las fases</option>
                {['INSCRIPCION', 'ADJUDICACION', 'CONTRATACION'].map((fase) => (
                  <option key={fase} value={fase}>{etiqueta(fase)}</option>
                ))}
              </select>
            </div>
          </div>
          {!convocatorias.isLoading && !convocatorias.isError && (
            <p className="mt-3 text-xs text-on-surface-variant" aria-live="polite">
              {convocatoriasFiltradas.length} {convocatoriasFiltradas.length === 1 ? 'resultado' : 'resultados'}
            </p>
          )}
          {convocatorias.isError && <div className="mt-5"><ErrorConsulta reintentar={() => void convocatorias.refetch()} /></div>}
          {convocatorias.isLoading ? (
            <p className="py-10 text-center text-sm text-on-surface-variant">Cargando convocatorias...</p>
          ) : convocatorias.data?.length === 0 ? (
            <p className="mt-5 rounded-xl border border-outline-variant bg-white p-6 text-center text-sm text-on-surface-variant">
              No hay convocatorias vigentes publicadas.
            </p>
          ) : convocatoriasFiltradas.length === 0 ? (
            <p className="mt-5 rounded-xl border border-outline-variant bg-white p-6 text-center text-sm text-on-surface-variant">
              No se encontraron convocatorias con esos criterios. Prueba otra búsqueda o fase.
            </p>
          ) : (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {conPrioridad(convocatoriasFiltradas, (c) => Boolean(c.pdfMeritosUrl)).slice(0, LIMITE_VISTA_PREVIA).map((convocatoria) => (
                <article key={convocatoria.id} className="rounded-xl border border-outline-variant bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">{etiqueta(convocatoria.fase)} · {convocatoria.numeroRD}</p>
                  <h3 className="mt-2 text-lg font-semibold">{convocatoria.titulo}</h3>
                  {convocatoria.descripcion && <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{convocatoria.descripcion}</p>}
                  <p className="mt-3 text-xs text-on-surface-variant">Vigencia: {fecha(convocatoria.fechaInicio)} – {fecha(convocatoria.fechaFin)}</p>
                  {convocatoria.pdfMeritosUrl && (
                    <VistaPreviaArchivo
                      url={convocatoria.pdfMeritosUrl}
                      titulo={`Convocatoria: ${convocatoria.titulo}`}
                      tipo="documento"
                    >
                      <span className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-container">
                        <FileText size={16} /> Ver documento
                      </span>
                    </VistaPreviaArchivo>
                  )}
                </article>
              ))}
            </div>
          )}
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => setMostrarAnuncioDescarga(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-primary px-5 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white"
            >
              Ver más <ArrowRight size={17} aria-hidden="true" />
            </button>
          </div>
        </section>

        <section id="comunicados" className="bg-[#fcf1ef]">
          <div className="mx-auto max-w-7xl scroll-mt-6 px-4 py-12 sm:px-6 lg:px-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">Noticias y avisos</p>
              <h2 className="mt-1 text-2xl font-bold">Comunicados oficiales</h2>
            </div>
            {comunicados.isError && <div className="mt-5"><ErrorConsulta reintentar={() => void comunicados.refetch()} /></div>}
            {comunicados.isLoading ? (
              <p className="py-10 text-center text-sm text-on-surface-variant">Cargando comunicados...</p>
            ) : comunicados.data?.length === 0 ? (
              <p className="mt-5 rounded-xl border border-outline-variant bg-white p-6 text-center text-sm text-on-surface-variant">
                No hay comunicados publicados.
              </p>
            ) : (
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {comunicados.data?.slice(0, LIMITE_VISTA_PREVIA).map((comunicado, indice) => {
                  const imagen = comunicado.imagenUrl
                    ? {
                        url: comunicado.imagenUrl,
                        alt: `Imagen del comunicado: ${comunicado.titulo}`,
                        fuente: null,
                      }
                    : imagenIlustrativaComunicado(comunicado.categoria, comunicado.titulo, indice);

                  return (
                    <article key={comunicado.id} className="overflow-hidden rounded-xl border border-outline-variant bg-white">
                      <figure>
                        <img src={imagen.url} alt={imagen.alt} loading="lazy" className="h-44 w-full object-cover" />
                        {imagen.fuente && (
                          <figcaption className="px-4 pt-2 text-right text-xs text-on-surface-variant">
                            Imagen ilustrativa ·{' '}
                            <a href={imagen.fuente} target="_blank" rel="noreferrer" className="underline">
                              Fuente: Pexels
                            </a>
                          </figcaption>
                        )}
                      </figure>
                      <div className="p-5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary">{etiqueta(comunicado.categoria)} · {fecha(comunicado.fecha)}</p>
                        <h3 className="mt-2 font-semibold">{comunicado.titulo}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{comunicado.resumen}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setMostrarAnuncioDescarga(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-primary px-5 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white"
              >
                Ver más <ArrowRight size={17} aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {mostrarAnuncioDescarga && (
        <section
          ref={anuncioDescargaRef}
          id="anuncio-descarga-app"
          tabIndex={-1}
          aria-labelledby="anuncio-descarga-titulo"
          className="scroll-mt-6 border-y-4 border-secondary bg-primary px-4 py-10 text-white outline-none ring-4 ring-secondary/50 sm:px-6"
        >
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-white/75">Lleva el portal contigo</p>
              <h2 id="anuncio-descarga-titulo" className="mt-1 text-2xl font-bold">
                Consulta desde la aplicación móvil
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-white/85">
                Descarga Educa Lambayeque para revisar vacantes, plazas, convocatorias y comunicados desde tu teléfono.
              </p>
            </div>
            <Link
              to="/descargar"
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-5 py-3 font-semibold text-primary transition hover:bg-[#fff1ec]"
            >
              <Download size={18} aria-hidden="true" />
              Descargar aplicación
            </Link>
          </div>
        </section>
      )}

      <footer className="border-t border-outline-variant bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-on-surface-variant sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>Educa Lambayeque · Portal ciudadano</p>
          <p>La información de demostración puede ser ficticia.</p>
        </div>
      </footer>
    </div>
  );
}

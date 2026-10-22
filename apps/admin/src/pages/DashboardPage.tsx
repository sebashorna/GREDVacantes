import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BookOpenCheck,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  FileText,
  Megaphone,
  PhoneCall,
  Search,
  SlidersHorizontal,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { EncabezadoPagina } from '@/components/EncabezadoPagina';
import { useAuth } from '@/features/auth/auth-context';
import { api } from '@/lib/api';
import type { Pagina } from '@/lib/tipos';
import { useUgeles } from '@/hooks/useCatalogos';

interface DatosDashboard {
  totales: {
    instituciones: number;
    vacantes: number;
    plazas: number;
    locales: number;
    alertasAbiertas: number;
    comunicadosPublicados: number;
  };
  cuposPorNivel: {
    nivel: string;
    _sum: { cupoTotal: number | null; cupoDisponibles: number | null };
  }[];
  plazasPorTipo: { tipo: string; _sum: { cantidad: number | null } }[];
}

interface VacantePortal {
  id: number;
  nivel: string;
  turno: string;
  estado: 'LIBRE' | 'COMPLETO' | 'LISTA_ESPERA' | 'CERRADO';
  cupoTotal: number;
  cupoDisponibles: number;
  fechaLimite: string | null;
  ie?: {
    nombre: string;
    codigoModular: string;
    ugel?: { nombre: string } | null;
    distrito?: { nombre: string } | null;
    provincia?: { nombre: string } | null;
  };
}

interface ComunicadoPortal {
  id: string;
  titulo: string;
  categoria: string;
  resumen: string;
  fecha: string;
}

const REGION_TODAS = 'Toda la Región';

function normalizar(valor: string): string {
  return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function fechaCorta(valor: string): string {
  return new Date(valor).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function etiqueta(valor: string): string {
  return valor
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letra) => letra.toUpperCase());
}

export function DashboardPage() {
  const { usuario } = useAuth();
  const ugeles = useUgeles();
  const [busqueda, setBusqueda] = useState('');
  const [ugelSeleccionada, setUgelSeleccionada] = useState(REGION_TODAS);

  const resumen = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await api.get<DatosDashboard>('/dashboard');
      return data;
    },
    enabled: !!usuario,
  });

  const vacantes = useQuery({
    queryKey: ['dashboard', 'vacantes'],
    queryFn: async () => {
      const { data } = await api.get<Pagina<VacantePortal>>('/vacantes?page=1&limit=100');
      return data;
    },
    enabled: !!usuario,
  });

  const comunicados = useQuery({
    queryKey: ['dashboard', 'comunicados'],
    queryFn: async () => {
      const { data } = await api.get<Pagina<ComunicadoPortal>>(
        '/comunicados?page=1&limit=2&publicado=true&sortBy=fecha&sortDir=desc',
      );
      return data;
    },
    enabled: !!usuario,
  });

  const vacantesFiltradas = useMemo(() => {
    const consulta = normalizar(busqueda.trim());
    return (vacantes.data?.data ?? [])
      .filter((vacante) => {
        const texto = normalizar([
          vacante.ie?.nombre,
          vacante.ie?.codigoModular,
          vacante.ie?.distrito?.nombre,
          vacante.ie?.provincia?.nombre,
          vacante.ie?.ugel?.nombre,
        ].filter(Boolean).join(' '));
        const coincideBusqueda = !consulta || texto.includes(consulta);
        const coincideUgel =
          ugelSeleccionada === REGION_TODAS ||
          normalizar(vacante.ie?.ugel?.nombre ?? '').includes(normalizar(ugelSeleccionada));
        return coincideBusqueda && coincideUgel;
      })
      .slice(0, 3);
  }, [busqueda, ugelSeleccionada, vacantes.data]);
  const ugelFiltros = [REGION_TODAS, ...(ugeles.data ?? []).map((ugel) => ugel.nombre)];

  const cuposDisponibles = resumen.data
    ? resumen.data.cuposPorNivel.reduce(
        (total, nivel) => total + (nivel._sum.cupoDisponibles ?? 0),
        0,
      )
    : 0;
  const plazasDisponibles = resumen.data
    ? resumen.data.plazasPorTipo.reduce(
        (total, plaza) => total + (plaza._sum.cantidad ?? 0),
        0,
      )
    : 0;

  const tarjetas = [
    {
      titulo: 'Vacantes alumnos',
      valor: resumen.isLoading ? '...' : cuposDisponibles.toLocaleString('es-PE'),
      detalle: 'Inicial, Primaria y Secundaria',
      icono: ClipboardList,
      estado: 'En vivo',
      color: 'text-tertiary',
    },
    {
      titulo: 'Plazas docentes',
      valor: resumen.isLoading ? '...' : plazasDisponibles.toLocaleString('es-PE'),
      detalle: 'Contrato y nombramiento',
      icono: BookOpenCheck,
      estado: 'Proceso activo',
      color: 'text-primary',
    },
  ];

  return (
    <div className="space-y-6">
      <EncabezadoPagina
        titulo="Portal Educativo Regional"
        descripcion="Información de vacantes, plazas docentes e instituciones de Lambayeque."
        extra={
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm font-medium text-on-surface-variant">
            <BadgeCheck size={16} className="text-primary" />
            Datos demostrativos
          </span>
        }
      />

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:max-w-sm">
            <Search
              size={18}
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              id="buscar-vacantes"
              type="search"
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              placeholder="Buscar colegio, código modular o distrito..."
              className="h-12 w-full rounded-lg border-[1.5px] border-outline-variant bg-white pl-10 pr-10 text-on-surface outline-none placeholder:text-on-surface-variant/60 focus:border-primary-container"
            />
            {busqueda && (
              <button
                type="button"
                aria-label="Limpiar búsqueda"
                onClick={() => setBusqueda('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
              >
                <X size={17} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <SlidersHorizontal size={17} className="text-primary" />
            <span>Filtrar por UGEL</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {ugelFiltros.map((ugel) => {
            const activa = ugelSeleccionada === ugel;
            return (
              <button
                key={ugel}
                type="button"
                aria-pressed={activa}
                onClick={() => setUgelSeleccionada(ugel)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  activa
                    ? 'border-primary-container bg-primary-container text-on-primary'
                    : 'border-outline-variant bg-white text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                {ugel}
              </button>
            );
          })}
          <p className="flex items-center text-sm text-on-surface-variant sm:ml-auto">
            {ugelSeleccionada === REGION_TODAS
              ? 'Datos consolidados para la región'
              : `Filtrado activo para ${ugelSeleccionada}`}
          </p>
        </div>
        {ugeles.isError && (
          <p role="alert" className="text-sm text-error">
            No se pudieron cargar las UGEL para el filtro.{' '}
            <button type="button" onClick={() => void ugeles.refetch()} className="font-semibold underline">
              Reintentar
            </button>
          </p>
        )}
      </section>

      {resumen.isError && (
        <div
          role="alert"
          className="rounded-xl border border-error/30 bg-error-container px-4 py-3 text-sm text-on-error-container"
        >
          No se pudo cargar el resumen del portal.{' '}
          <button type="button" onClick={() => void resumen.refetch()} className="font-semibold underline">
            Reintentar
          </button>
        </div>
      )}

      <section aria-label="Indicadores regionales" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {tarjetas.map(({ titulo, valor, detalle, icono: Icono, estado, color }) => (
          <article
            key={titulo}
            className="rounded-xl border border-outline-variant border-l-4 border-l-primary-container bg-white p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-on-surface-variant">{titulo}</p>
                <p className="mt-1 text-3xl font-bold text-primary">{valor}</p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-high text-primary">
                <Icono size={21} />
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/60 pt-3">
              <span className={`flex items-center gap-1.5 text-sm ${color}`}>
                <ArrowUpRight size={15} />
                {detalle}
              </span>
              <span className="rounded-full bg-surface-container px-2.5 py-1 text-xs font-medium text-on-surface-variant">
                {estado}
              </span>
            </div>
          </article>
        ))}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-on-surface">Vacantes registradas</h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              Consulta el estado y la disponibilidad de cada institución.
            </p>
          </div>
          <Link to="/vacantes">
            <span className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-primary-container/30 bg-primary-container/10 px-3 text-xs font-semibold text-primary-container transition hover:bg-primary-container/20">
              Ver todas las vacantes <ArrowRight size={15} />
            </span>
          </Link>
        </div>

        <div className="space-y-3">
          {vacantes.isLoading && (
            <div className="rounded-xl border border-outline-variant bg-white p-8 text-center text-sm text-on-surface-variant">
              Cargando vacantes...
            </div>
          )}
          {vacantes.isError && (
            <div
              role="alert"
              className="rounded-xl border border-error/30 bg-error-container p-4 text-sm text-on-error-container"
            >
              No se pudieron cargar las vacantes.{' '}
              <button type="button" onClick={() => void vacantes.refetch()} className="font-semibold underline">
                Reintentar
              </button>
            </div>
          )}
          {!vacantes.isLoading && !vacantes.isError && vacantesFiltradas.length === 0 && (
            <div className="rounded-xl border border-outline-variant bg-white p-8 text-center text-sm text-on-surface-variant">
              No hay vacantes que coincidan con la búsqueda.
            </div>
          )}
          {vacantesFiltradas.map((vacante) => {
            const ocupados = Math.max(vacante.cupoTotal - vacante.cupoDisponibles, 0);
            return (
              <article key={vacante.id} className="rounded-xl border border-outline-variant bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/60 pb-3">
                  <div>
                    <p className="text-sm font-semibold text-on-surface">
                      {vacante.ie?.nombre ?? 'Institución educativa'}
                    </p>
                    <p className="mt-1 text-xs text-on-surface-variant">
                      Código modular: {vacante.ie?.codigoModular ?? '—'}
                    </p>
                  </div>
                  {vacante.ie?.ugel?.nombre && (
                    <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-medium text-on-surface-variant">
                      {vacante.ie.ugel.nombre}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-4 pt-3">
                  <div className="space-y-1 text-sm text-on-surface-variant">
                    <p>
                      Nivel: {etiqueta(vacante.nivel)} · Turno: {etiqueta(vacante.turno)}
                    </p>
                    {vacante.ie?.distrito?.nombre && <p>Distrito: {vacante.ie.distrito.nombre}</p>}
                    {vacante.fechaLimite && <p>Fecha límite: {fechaCorta(vacante.fechaLimite)}</p>}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xl font-bold text-on-surface">
                        {ocupados} <span className="font-normal text-on-surface-variant">/ {vacante.cupoTotal}</span>
                      </p>
                      <p className={`text-xs font-semibold ${vacante.cupoDisponibles ? 'text-tertiary' : 'text-error'}`}>
                        {vacante.estado === 'LISTA_ESPERA'
                          ? 'Lista de espera'
                          : vacante.estado === 'CERRADO'
                            ? 'Inscripción cerrada'
                            : vacante.cupoDisponibles
                              ? `${vacante.cupoDisponibles} cupos libres`
                              : 'Completo'}
                      </p>
                    </div>
                    <Link
                      to="/vacantes"
                      aria-label={`Ver vacantes de ${vacante.ie?.nombre ?? 'institución educativa'}`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-outline-variant text-primary transition hover:bg-surface-container-low"
                    >
                      {vacante.cupoDisponibles ? <CheckCircle2 size={18} /> : <CircleHelp size={18} />}
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-on-surface">
          <Zap size={19} className="text-primary" />
          Módulos prioritarios
        </h2>
        <article className="flex flex-col justify-between gap-4 rounded-xl border border-[#9f462d] bg-[#9f462d] p-5 text-white sm:flex-row sm:items-center">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/80">
              Matrícula regional 2026 · Demostración
            </span>
            <h3 className="mt-1 text-lg font-semibold text-white">
              ¿Buscas vacante escolar para tus hijos?
            </h3>
            <p className="mt-1 text-sm text-white/90">
              Consulta las vacantes disponibles en las instituciones de tu distrito.
            </p>
          </div>
          <Link
            to="/vacantes"
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-lg border border-white/70 bg-[#9f462d] px-5 text-sm font-semibold text-white transition hover:bg-[#8c3d27] active:bg-[#8c3d27]"
          >
            Consultar vacantes <ArrowRight size={16} />
          </Link>
        </article>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link to="/plazas" className="rounded-xl border border-outline-variant bg-white p-5 transition hover:border-primary-container">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-high text-primary">
              <Users size={21} />
            </span>
            <h3 className="mt-3 font-semibold text-on-surface">Plazas docentes</h3>
            <p className="mt-1 text-sm text-on-surface-variant">
              Consulta plazas disponibles y cronogramas de adjudicación.
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
              Ver plazas <ChevronRight size={16} />
            </span>
          </Link>
          <Link to="/alertas" className="rounded-xl border border-outline-variant bg-white p-5 transition hover:border-primary-container">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-high text-secondary">
              <Building2 size={21} />
            </span>
            <h3 className="mt-3 font-semibold text-on-surface">Estado de I.E.</h3>
            <p className="mt-1 text-sm text-on-surface-variant">
              Consulta reportes y alertas de las instituciones educativas.
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-secondary">
              Ver alertas <ChevronRight size={16} />
            </span>
          </Link>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-on-surface">
              <Megaphone size={19} className="text-primary" />
              Comunicados oficiales GRED
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant">Lambayeque al día</p>
          </div>
        </div>
        {comunicados.isLoading && (
          <div className="rounded-xl border border-outline-variant bg-white p-8 text-center text-sm text-on-surface-variant">
            Cargando comunicados...
          </div>
        )}
        {comunicados.isError && (
          <div
            role="alert"
            className="rounded-xl border border-error/30 bg-error-container p-4 text-sm text-on-error-container"
          >
            No se pudieron cargar los comunicados.{' '}
            <button type="button" onClick={() => void comunicados.refetch()} className="font-semibold underline">
              Reintentar
            </button>
          </div>
        )}
        {comunicados.data?.data.length === 0 && (
          <div className="rounded-xl border border-outline-variant bg-white p-8 text-center text-sm text-on-surface-variant">
            No hay comunicados publicados.
          </div>
        )}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {comunicados.data?.data.map((comunicado) => (
            <article key={comunicado.id} className="flex items-start gap-3 rounded-xl border border-[#9f462d] bg-[#9f462d] p-4 text-white">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white">
                <FileText size={20} />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
                  {etiqueta(comunicado.categoria)} · {fechaCorta(comunicado.fecha)}
                </p>
                <h3 className="mt-1 font-semibold text-white">{comunicado.titulo}</h3>
                <p className="mt-1 text-sm text-white/90">{comunicado.resumen}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-outline-variant bg-white p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-primary">
            <PhoneCall size={20} />
          </span>
          <div>
            <h3 className="font-semibold text-on-surface">Línea de Orientación Ciudadana</h3>
            <p className="mt-1 text-sm text-on-surface-variant">
              Atención telefónica gratuita: (074) 231500 · Chiclayo
            </p>
          </div>
          <a
            href="tel:+5174231500"
            aria-label="Llamar a orientación ciudadana"
            className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-outline-variant text-primary hover:bg-surface-container-low"
          >
            <PhoneCall size={18} />
          </a>
        </div>
      </section>
    </div>
  );
}

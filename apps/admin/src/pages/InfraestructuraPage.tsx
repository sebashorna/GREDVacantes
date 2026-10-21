import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Building2,
  ChevronDown,
  ChevronRight,
  Droplet,
  FileCheck2,
  MapPin,
  Search,
  Wifi,
  X,
  Zap,
} from 'lucide-react';

import { ESTADOS_LOCAL, ETIQUETAS_ESTADO_LOCAL } from '@shared';
import { EncabezadoPagina } from '@/components/EncabezadoPagina';
import { Badge, type TonoBadge } from '@/components/ui/Badge';
import { Paginacion } from '@/components/ui/Paginacion';
import { useAuth, mensajeDeError } from '@/features/auth/auth-context';
import { usePaginacion } from '@/hooks/usePaginacion';
import { useUgeles } from '@/hooks/useCatalogos';
import { api } from '@/lib/api';
import type { LocalEscolar, Pagina } from '@/lib/tipos';

const TONOS_ESTADO: Record<string, TonoBadge> = {
  OPTIMO: 'exito',
  MANTENIMIENTO_PREVENTIVO: 'info',
  EN_REFRACCION: 'advertencia',
  AULAS_TEMPORALES: 'advertencia',
  ATENCION_PRIORITARIA: 'error',
  OPERATIVO_REGULAR: 'neutro',
};

const ETIQUETAS_ESTADO: Record<string, string> = { ...ETIQUETAS_ESTADO_LOCAL };

const ETIQUETAS_AGUA: Record<string, string> = {
  AGUA_24H: 'Agua 24 h',
  CISTERNA: 'Cisterna',
  RED_OK: 'Agua de red',
  NO_DISPONIBLE: 'Sin agua',
};

function fechaCorta(valor: string | null): string {
  if (!valor) return 'Sin registro';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return 'Sin registro';
  return fecha.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
}

export function InfraestructuraPage() {
  const { usuario } = useAuth();
  const { busqueda, setBusqueda, setPagina, params } = usePaginacion();
  const [fUgel, setFUgel] = useState('');
  const [fEstado, setFEstado] = useState('');
  const [prioritario, setPrioritario] = useState(false);
  const [detalleAbierto, setDetalleAbierto] = useState<number | null>(null);
  const ugeles = useUgeles();

  const locales = useQuery({
    queryKey: ['locales', params, fUgel, fEstado, prioritario],
    queryFn: async () => {
      const filtros = new URLSearchParams({
        page: String(params.page),
        limit: String(params.limit),
        ...(params.search ? { search: params.search } : {}),
        ...(fUgel ? { ugelId: fUgel } : {}),
        ...(fEstado ? { estado: fEstado } : {}),
        ...(prioritario ? { prioritario: 'true' } : {}),
      });
      const { data } = await api.get<Pagina<LocalEscolar>>(`/locales?${filtros}`);
      return data;
    },
    enabled: !!usuario,
  });

  const sel = 'h-11 rounded-lg border border-outline-variant bg-white px-3 text-sm text-on-surface outline-none focus:border-primary';
  const cambiarFiltro = (cambio: () => void) => {
    cambio();
    setPagina(1);
  };

  return (
    <div className="space-y-6">
      <EncabezadoPagina
        titulo="Infraestructura y aulas"
        descripcion="Diagnóstico regional de locales escolares y sus servicios."
        extra={
          <span className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm font-medium text-on-surface-variant">
            <Building2 size={17} className="text-primary" />
            GRED Lambayeque
          </span>
        }
      />

      <section className="space-y-4 rounded-xl border border-outline-variant bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search size={18} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="search"
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              placeholder="Buscar local, código o distrito..."
              aria-label="Buscar locales escolares"
              className="h-11 w-full rounded-lg border border-outline-variant bg-white pl-10 pr-10 text-sm outline-none placeholder:text-on-surface-variant/70 focus:border-primary"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                aria-label="Limpiar búsqueda"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <select
            aria-label="Filtrar por estado del local"
            value={fEstado}
            onChange={(evento) => cambiarFiltro(() => setFEstado(evento.target.value))}
            className={sel}
          >
            <option value="">Todos los estados</option>
            {ESTADOS_LOCAL.map((estado) => (
              <option key={estado} value={estado}>{ETIQUETAS_ESTADO_LOCAL[estado]}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            aria-pressed={!fUgel}
            onClick={() => cambiarFiltro(() => setFUgel(''))}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
              !fUgel ? 'bg-primary-container text-on-primary' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            Todas las UGEL
          </button>
          {(ugeles.data ?? []).map((ugel) => {
            const activa = fUgel === String(ugel.id);
            return (
              <button
                key={ugel.id}
                type="button"
                aria-pressed={activa}
                onClick={() => cambiarFiltro(() => setFUgel(activa ? '' : String(ugel.id)))}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activa ? 'bg-primary-container text-on-primary' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {ugel.nombre}
              </button>
            );
          })}
        </div>
        {ugeles.isError && (
          <p role="alert" className="text-sm text-error">
            No se pudieron cargar las UGEL: {mensajeDeError(ugeles.error)}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/60 pt-3">
          <button
            type="button"
            aria-pressed={prioritario}
            onClick={() => cambiarFiltro(() => setPrioritario((actual) => !actual))}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
              prioritario
                ? 'border-error/30 bg-error-container text-on-error-container'
                : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-low'
            }`}
          >
            <AlertTriangle size={16} />
            {prioritario ? 'Mostrando locales prioritarios' : 'Ver locales prioritarios'}
          </button>
          <p className="text-sm font-semibold text-primary">
            {locales.isLoading ? 'Cargando locales...' : `${locales.data?.meta.total ?? 0} locales escolares`}
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-error/20 bg-error-container/50 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-error">
            <AlertTriangle size={20} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-error">Vigilancia comunitaria</p>
            <h2 className="mt-1 text-base font-semibold text-on-surface">Atención a la infraestructura escolar</h2>
            <p className="mt-1 max-w-3xl text-sm text-on-surface-variant">
              Revisa los locales en refacción, con aulas temporales o que requieren atención prioritaria.
            </p>
            <button
              type="button"
              onClick={() => cambiarFiltro(() => setPrioritario(true))}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-error hover:underline"
            >
              Ver locales prioritarios <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-3" aria-label="Locales escolares e infraestructura evaluada">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-on-surface">Locales escolares</h2>
            <p className="text-sm text-on-surface-variant">Información de infraestructura disponible en el registro regional.</p>
          </div>
          <p className="text-xs text-on-surface-variant">
            {locales.data ? `Página ${locales.data.meta.page} de ${locales.data.meta.totalPages}` : ''}
          </p>
        </div>

        {locales.isError ? (
          <p role="alert" className="rounded-xl border border-error/30 bg-error-container p-5 text-center text-sm text-on-error-container">
            No se pudieron cargar los locales: {mensajeDeError(locales.error)}
          </p>
        ) : locales.isLoading ? (
          <p className="rounded-xl border border-outline-variant bg-white p-8 text-center text-sm text-on-surface-variant">
            Cargando información de infraestructura...
          </p>
        ) : (locales.data?.data.length ?? 0) === 0 ? (
          <p className="rounded-xl border border-outline-variant bg-white p-8 text-center text-sm text-on-surface-variant">
            No se encontraron locales con estos filtros.
          </p>
        ) : (
          <>
            {locales.data?.data.map((local) => {
              const abierto = detalleAbierto === local.id;
              const estadoTono = TONOS_ESTADO[local.estado] ?? 'neutro';
              return (
                <article key={local.id} className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-sm">
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-on-surface">
                          {local.ie?.nombre ?? `Institución educativa #${local.ieId}`}
                        </h3>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-on-surface-variant">
                          <MapPin size={14} className="shrink-0" />
                          {local.ie?.distrito?.provincia?.nombre
                            ? `Provincia: ${local.ie.distrito.provincia.nombre} · `
                            : ''}
                          Distrito: {local.ie?.distrito?.nombre ?? 'Sin distrito'}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-outline">Código local</p>
                        <p className="text-sm font-bold tracking-wide text-primary">{local.codigoLocal}</p>
                        {local.ie?.ugel?.nombre && (
                          <p className="mt-0.5 text-xs text-on-surface-variant">UGEL {local.ie.ugel.nombre}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge tono={estadoTono}>{ETIQUETAS_ESTADO[local.estado] ?? local.estado}</Badge>
                      {local._count && local._count.alertas > 0 && (
                        <Badge tono="error">
                          {local._count.alertas} {local._count.alertas === 1 ? 'alerta registrada' : 'alertas registradas'}
                        </Badge>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-surface-container-low p-3 sm:grid-cols-4">
                      <div className="col-span-2 sm:col-span-1">
                        <p className="text-xl font-bold text-primary">
                          {local.aulasOperativas}{local.aulasTotales > local.aulasOperativas ? `/${local.aulasTotales}` : ''}
                        </p>
                        <p className="text-xs text-on-surface-variant">Aulas operativas</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Droplet size={16} className={local.agua === 'NO_DISPONIBLE' ? 'text-error' : 'text-primary'} />
                        <div>
                          <p className="text-xs font-semibold text-on-surface">{ETIQUETAS_AGUA[local.agua] ?? local.agua}</p>
                          <p className="text-[11px] text-on-surface-variant">Agua</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap size={16} className={local.luz ? 'text-primary' : 'text-outline'} />
                        <div>
                          <p className="text-xs font-semibold text-on-surface">{local.luz ? 'Disponible' : 'Sin registro'}</p>
                          <p className="text-[11px] text-on-surface-variant">Energía eléctrica</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wifi size={16} className={local.fibra ? 'text-primary' : 'text-outline'} />
                        <div>
                          <p className="text-xs font-semibold text-on-surface">{local.fibra ? 'Disponible' : 'Sin registro'}</p>
                          <p className="text-[11px] text-on-surface-variant">Conectividad</p>
                        </div>
                      </div>
                    </div>

                    {abierto && (
                      <dl className="mt-3 grid gap-2 rounded-lg border border-outline-variant/70 p-3 text-sm sm:grid-cols-2">
                        <div>
                          <dt className="text-xs text-on-surface-variant">Capacidad de alumnos</dt>
                          <dd className="font-medium text-on-surface">{local.capacidadAlumnos ?? 'Sin registro'}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-on-surface-variant">Última inspección</dt>
                          <dd className="font-medium capitalize text-on-surface">{fechaCorta(local.ultimaInspeccion)}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-on-surface-variant">Avance de obras</dt>
                          <dd className="font-medium text-on-surface">
                            {local.avanceObras === null ? 'Sin registro' : `${local.avanceObras}%`}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-on-surface-variant">Alertas asociadas</dt>
                          <dd className="font-medium text-on-surface">{local._count?.alertas ?? 0}</dd>
                        </div>
                        {local.fichaEdanUrl && (
                          <div className="sm:col-span-2">
                            <a
                              href={local.fichaEdanUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
                            >
                              <FileCheck2 size={16} /> Abrir ficha EDAN
                            </a>
                          </div>
                        )}
                      </dl>
                    )}

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/60 pt-3">
                      <p className="text-xs text-on-surface-variant">
                        Inspección: {fechaCorta(local.ultimaInspeccion)}
                      </p>
                      <button
                        type="button"
                        aria-expanded={abierto}
                        onClick={() => setDetalleAbierto(abierto ? null : local.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-surface-container-low px-3 py-2 text-sm font-semibold text-primary hover:bg-surface-container-high"
                      >
                        {abierto ? 'Ocultar ficha' : 'Ver ficha técnica'}
                        {abierto ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
            {locales.data && (
              <Paginacion
                pagina={locales.data.meta.page}
                totalPaginas={locales.data.meta.totalPages}
                total={locales.data.meta.total}
                onPagina={setPagina}
                cargando={locales.isFetching}
              />
            )}
          </>
        )}
      </section>

      <aside className="rounded-xl border border-outline-variant bg-white p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
            <Building2 size={18} />
          </span>
          <div>
            <h2 className="font-semibold text-on-surface">Transparencia de infraestructura</h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              La ficha muestra los datos registrados para cada local escolar. La información que no está disponible en el registro se indica como «Sin registro».
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}

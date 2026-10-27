import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Building2,
  ChevronDown,
  ChevronRight,
  Droplet,
  FileCheck2,
  MapPin,
  Pencil,
  Search,
  Trash2,
  Wifi,
  Zap,
} from 'lucide-react';

import {
  ESTADOS_LOCAL,
  ESTADOS_SERVICIO,
  ETIQUETAS_ESTADO_ALERTA,
  ETIQUETAS_ESTADO_LOCAL,
} from '@shared';
import { EncabezadoPagina } from '@/components/EncabezadoPagina';
import { Badge, type TonoBadge } from '@/components/ui/Badge';
import { Boton } from '@/components/ui/Boton';
import { CampoSelect, CampoTexto } from '@/components/ui/Campo';
import { CampoCargaArchivo } from '@/components/ui/CampoCargaArchivo';
import { Confirmacion } from '@/components/ui/Confirmacion';
import { Modal } from '@/components/ui/Modal';
import { Paginacion } from '@/components/ui/Paginacion';
import { VistaPreviaArchivo } from '@/components/ui/VistaPreviaArchivo';
import { PanelFiltros } from '@/components/ui/PanelFiltros';
import { useAuth, mensajeDeError } from '@/features/auth/auth-context';
import { usePaginacion } from '@/hooks/usePaginacion';
import { useInstitucionesOpciones, useUgeles } from '@/hooks/useCatalogos';
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

const TONOS_ALERTA: Record<string, TonoBadge> = {
  ABIERTA: 'error',
  EN_ATENCION: 'advertencia',
  RESUELTA: 'exito',
  DESCARTADA: 'neutro',
};

interface DatosLocal {
  ieId: string;
  codigoLocal: string;
  estado: (typeof ESTADOS_LOCAL)[number];
  aulasOperativas: string;
  aulasTotales: string;
  agua: (typeof ESTADOS_SERVICIO)[number];
  luz: boolean;
  fibra: boolean;
  capacidadAlumnos: string;
  avanceObras: string;
  presupuesto: string;
  fichaEdanUrl: string;
  ultimaInspeccion: string;
}

function formularioInicial(local?: LocalEscolar): DatosLocal {
  return {
    ieId: String(local?.ieId ?? ''),
    codigoLocal: local?.codigoLocal ?? '',
    estado: (local?.estado as DatosLocal['estado']) ?? 'OPERATIVO_REGULAR',
    aulasOperativas: String(local?.aulasOperativas ?? 0),
    aulasTotales: String(local?.aulasTotales ?? 0),
    agua: (local?.agua as DatosLocal['agua']) ?? 'NO_DISPONIBLE',
    luz: local?.luz ?? false,
    fibra: local?.fibra ?? false,
    capacidadAlumnos: local?.capacidadAlumnos == null ? '' : String(local.capacidadAlumnos),
    avanceObras: local?.avanceObras == null ? '' : String(local.avanceObras),
    presupuesto: local?.presupuesto == null ? '' : String(local.presupuesto),
    fichaEdanUrl: local?.fichaEdanUrl ?? '',
    ultimaInspeccion: local?.ultimaInspeccion?.slice(0, 10) ?? '',
  };
}

function FormularioLocal({
  inicial,
  onExito,
  onCancelar,
}: {
  inicial?: LocalEscolar;
  onExito: () => void;
  onCancelar: () => void;
}) {
  const queryClient = useQueryClient();
  const instituciones = useInstitucionesOpciones(inicial?.ie?.codigoModular ?? '');
  const [datos, setDatos] = useState(() => formularioInicial(inicial));
  const guardar = useMutation({
    mutationFn: async () => {
      const payload = {
        ieId: Number(datos.ieId),
        codigoLocal: datos.codigoLocal.trim(),
        estado: datos.estado,
        aulasOperativas: Number(datos.aulasOperativas),
        aulasTotales: Number(datos.aulasTotales),
        agua: datos.agua,
        luz: datos.luz,
        fibra: datos.fibra,
        capacidadAlumnos: datos.capacidadAlumnos ? Number(datos.capacidadAlumnos) : null,
        avanceObras: datos.avanceObras ? Number(datos.avanceObras) : null,
        presupuesto: datos.presupuesto ? Number(datos.presupuesto) : null,
        fichaEdanUrl: datos.fichaEdanUrl.trim() || null,
        ultimaInspeccion: datos.ultimaInspeccion
          ? new Date(`${datos.ultimaInspeccion}T00:00:00`).toISOString()
          : null,
      };
      return inicial
        ? api.put(`/locales/${inicial.id}`, payload)
        : api.post('/locales', payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['locales'] });
      void queryClient.invalidateQueries({ queryKey: ['alertas'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(inicial ? 'Local actualizado' : 'Local registrado');
      onExito();
    },
    onError: (error) => toast.error(mensajeDeError(error)),
  });
  const actualizar = <K extends keyof DatosLocal>(campo: K, valor: DatosLocal[K]) => {
    setDatos((actual) => ({ ...actual, [campo]: valor }));
  };
  const enviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    guardar.mutate();
  };

  return (
    <form onSubmit={enviar} className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <CampoSelect
          etiqueta="Institución educativa"
          valor={datos.ieId}
          onChange={(valor) => actualizar('ieId', valor)}
          deshabilitado={Boolean(inicial)}
          opciones={(instituciones.data?.data ?? []).map((ie) => ({
            valor: String(ie.id),
            etiqueta: `${ie.nombre} (${ie.codigoModular})`,
          }))}
        />
        {instituciones.isLoading && <p className="mt-1 text-xs text-on-surface-variant">Cargando instituciones...</p>}
        {instituciones.isError && (
          <p role="alert" className="mt-1 text-xs text-error">
            No se pudieron cargar las instituciones.{' '}
            <button type="button" onClick={() => void instituciones.refetch()} className="font-semibold underline">Reintentar</button>
          </p>
        )}
      </div>
      <CampoTexto
        etiqueta="Código local"
        valor={datos.codigoLocal}
        onChange={(valor) => actualizar('codigoLocal', valor)}
        deshabilitado={Boolean(inicial)}
      />
      <CampoSelect
        etiqueta="Estado del local"
        valor={datos.estado}
        onChange={(valor) => actualizar('estado', valor as DatosLocal['estado'])}
        opciones={ESTADOS_LOCAL.map((estado) => ({
          valor: estado,
          etiqueta: ETIQUETAS_ESTADO_LOCAL[estado],
        }))}
      />
      <CampoTexto
        etiqueta="Aulas operativas"
        tipo="number"
        min={0}
        max={500}
        valor={datos.aulasOperativas}
        onChange={(valor) => actualizar('aulasOperativas', valor)}
      />
      <CampoTexto
        etiqueta="Aulas totales"
        tipo="number"
        min={0}
        max={500}
        valor={datos.aulasTotales}
        onChange={(valor) => actualizar('aulasTotales', valor)}
      />
      <CampoSelect
        etiqueta="Servicio de agua"
        valor={datos.agua}
        onChange={(valor) => actualizar('agua', valor as DatosLocal['agua'])}
        opciones={ESTADOS_SERVICIO.map((estado) => ({
          valor: estado,
          etiqueta: ETIQUETAS_AGUA[estado] ?? estado,
        }))}
      />
      <CampoTexto
        etiqueta="Capacidad de alumnos (opcional)"
        tipo="number"
        min={0}
        max={10000}
        valor={datos.capacidadAlumnos}
        onChange={(valor) => actualizar('capacidadAlumnos', valor)}
      />
      <CampoTexto
        etiqueta="Avance de obras % (opcional)"
        tipo="number"
        min={0}
        max={100}
        paso={0.01}
        valor={datos.avanceObras}
        onChange={(valor) => actualizar('avanceObras', valor)}
      />
      <CampoTexto
        etiqueta="Presupuesto (opcional)"
        tipo="number"
        min={0}
        paso={0.01}
        valor={datos.presupuesto}
        onChange={(valor) => actualizar('presupuesto', valor)}
      />
      <CampoTexto
        etiqueta="Última inspección (opcional)"
        tipo="date"
        valor={datos.ultimaInspeccion}
        onChange={(valor) => actualizar('ultimaInspeccion', valor)}
      />
      <div>
        <CampoTexto
          etiqueta="URL de ficha EDAN (opcional)"
          tipo="url"
          valor={datos.fichaEdanUrl.startsWith('data:') ? '' : datos.fichaEdanUrl}
          onChange={(valor) => actualizar('fichaEdanUrl', valor)}
        />
        <div className="mt-3">
          <CampoCargaArchivo
            etiqueta="Adjuntar ficha EDAN en PDF"
            tipo="pdf"
            archivos={datos.fichaEdanUrl ? [datos.fichaEdanUrl] : []}
            onChange={(archivos) => actualizar('fichaEdanUrl', archivos[0] ?? '')}
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm font-medium text-on-surface">
        <input type="checkbox" checked={datos.luz} onChange={(evento) => actualizar('luz', evento.target.checked)} />
        Cuenta con energía eléctrica
      </label>
      <label className="flex items-center gap-2 text-sm font-medium text-on-surface">
        <input type="checkbox" checked={datos.fibra} onChange={(evento) => actualizar('fibra', evento.target.checked)} />
        Cuenta con conectividad de fibra
      </label>
      <div className="md:col-span-2 flex justify-end gap-2">
        <Boton variante="secundario" onClick={onCancelar} disabled={guardar.isPending}>Cancelar</Boton>
        <Boton
          type="submit"
          disabled={guardar.isPending || instituciones.isLoading || instituciones.isError || !datos.ieId || !datos.codigoLocal.trim()}
        >
          {guardar.isPending ? 'Guardando...' : inicial ? 'Guardar cambios' : 'Registrar local'}
        </Boton>
      </div>
    </form>
  );
}

function fechaCorta(valor: string | null): string {
  if (!valor) return 'Sin registro';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return 'Sin registro';
  return fecha.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
}

export function InfraestructuraPage() {
  const { usuario, puede } = useAuth();
  const queryClient = useQueryClient();
  const { busqueda, setBusqueda, setPagina, params } = usePaginacion();
  const [busquedaBorrador, setBusquedaBorrador] = useState('');
  const [fUgel, setFUgel] = useState('');
  const [fUgelBorrador, setFUgelBorrador] = useState('');
  const [fEstado, setFEstado] = useState('');
  const [fEstadoBorrador, setFEstadoBorrador] = useState('');
  const [prioritario, setPrioritario] = useState(false);
  const [prioritarioBorrador, setPrioritarioBorrador] = useState(false);
  const [detalleAbierto, setDetalleAbierto] = useState<number | null>(null);
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [localEditando, setLocalEditando] = useState<LocalEscolar | null>(null);
  const [localEliminando, setLocalEliminando] = useState<LocalEscolar | null>(null);
  const puedeRegistrar = puede('ADMIN_GRED', 'EDITOR_UGEL');
  const puedeAdministrar = puede('ADMIN_GRED');
  const ugeles = useUgeles();
  const eliminar = useMutation({
    mutationFn: (id: number) => api.delete(`/locales/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['locales'] });
      void queryClient.invalidateQueries({ queryKey: ['alertas'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['instituciones'] });
      toast.success('Local escolar eliminado');
      setLocalEliminando(null);
    },
    onError: (error) => toast.error(mensajeDeError(error)),
  });

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
  const filtrosActivos = [
    ...(busqueda ? [`Búsqueda: ${busqueda}`] : []),
    ...(fEstado ? [`Estado: ${ETIQUETAS_ESTADO_LOCAL[fEstado as keyof typeof ETIQUETAS_ESTADO_LOCAL] ?? fEstado}`] : []),
    ...(fUgel ? [`UGEL: ${ugeles.data?.find((ugel) => String(ugel.id) === fUgel)?.nombre ?? fUgel}`] : []),
    ...(prioritario ? ['Locales prioritarios'] : []),
  ];
  const activarPrioritarios = () => {
    setBusquedaBorrador(busqueda);
    setFUgelBorrador(fUgel);
    setFEstadoBorrador(fEstado);
    setPrioritarioBorrador(true);
    cambiarFiltro(() => setPrioritario(true));
  };

  return (
    <div className="space-y-6">
      <EncabezadoPagina
        titulo="Infraestructura y aulas"
        icono={Building2}
        descripcion="Diagnóstico regional de locales escolares y sus servicios."
        accion={puedeRegistrar ? {
          etiqueta: 'Registrar local',
          onClick: () => { setLocalEditando(null); setFormularioAbierto(true); },
        } : undefined}
        extra={
          <span className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm font-medium text-on-surface-variant">
            <Building2 size={17} className="text-primary" />
            GRED Lambayeque
          </span>
        }
      />

      <PanelFiltros
        filtrosActivos={filtrosActivos}
        onAplicar={() => {
          setBusqueda(busquedaBorrador);
          setFUgel(fUgelBorrador);
          setFEstado(fEstadoBorrador);
          setPrioritario(prioritarioBorrador);
          setPagina(1);
        }}
        onLimpiar={() => {
          setBusquedaBorrador('');
          setBusqueda('');
          setFUgelBorrador('');
          setFUgel('');
          setFEstadoBorrador('');
          setFEstado('');
          setPrioritarioBorrador(false);
          setPrioritario(false);
          setPagina(1);
        }}
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="relative sm:col-span-2">
              <Search size={18} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="search"
                value={busquedaBorrador}
                onChange={(evento) => setBusquedaBorrador(evento.target.value)}
                placeholder="Buscar local, código o distrito..."
                aria-label="Buscar locales escolares"
                className="h-11 w-full rounded-lg border border-outline-variant bg-white pl-10 pr-10 text-sm outline-none placeholder:text-on-surface-variant/70 focus:border-primary"
              />
            </div>
            <select
              aria-label="Filtrar por estado del local"
              value={fEstadoBorrador}
              onChange={(evento) => setFEstadoBorrador(evento.target.value)}
              className={sel}
            >
              <option value="">Todos los estados</option>
              {ESTADOS_LOCAL.map((estado) => (
                <option key={estado} value={estado}>{ETIQUETAS_ESTADO_LOCAL[estado]}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" aria-pressed={!fUgelBorrador} onClick={() => setFUgelBorrador('')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                !fUgelBorrador ? 'bg-primary-container text-on-primary' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
              }`}>
              Todas las UGEL
            </button>
            {(ugeles.data ?? []).map((ugel) => {
              const activa = fUgelBorrador === String(ugel.id);
              return (
                <button key={ugel.id} type="button" aria-pressed={activa}
                  onClick={() => setFUgelBorrador(activa ? '' : String(ugel.id))}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activa ? 'bg-primary-container text-on-primary' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                  }`}>
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
          <button
            type="button"
            aria-pressed={prioritarioBorrador}
            onClick={() => setPrioritarioBorrador((actual) => !actual)}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
              prioritarioBorrador
                ? 'border-error/30 bg-error-container text-on-error-container'
                : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-low'
            }`}
          >
            <AlertTriangle size={16} />
            {prioritarioBorrador ? 'Solo locales prioritarios' : 'Incluir solo locales prioritarios'}
          </button>
        </div>
      </PanelFiltros>
      <p className="text-right text-sm font-semibold text-primary">
        {locales.isLoading ? 'Cargando locales...' : `${locales.data?.meta.total ?? 0} locales escolares`}
      </p>

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
              onClick={activarPrioritarios}
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
                      <div className="mt-3 space-y-3">
                      <dl className="grid gap-2 rounded-lg border border-outline-variant/70 p-3 text-sm sm:grid-cols-2">
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
                            <VistaPreviaArchivo
                              url={local.fichaEdanUrl}
                              titulo="Ficha EDAN"
                              tipo="documento"
                            >
                              <span className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline">
                                <FileCheck2 size={16} /> Ver ficha EDAN
                              </span>
                            </VistaPreviaArchivo>
                          </div>
                        )}
                      </dl>
                      <section aria-label={`Alertas recientes de ${local.ie?.nombre ?? 'la institución'}`} className="rounded-lg border border-outline-variant/70 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-sm font-semibold text-on-surface">Alertas recientes</h4>
                          <Link
                            to="/alertas"
                            className="text-xs font-semibold text-primary hover:underline"
                          >
                            Ver todas las alertas
                          </Link>
                        </div>
                        {local.alertas?.length ? (
                          <ul className="mt-2 space-y-2">
                            {local.alertas.map((alerta) => (
                              <li key={alerta.id} className="flex flex-wrap items-start justify-between gap-2 rounded-lg bg-surface-container-low p-2.5">
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-semibold text-on-surface">{alerta.descripcion}</p>
                                  <p className="mt-1 text-[11px] text-on-surface-variant">
                                    {alerta.tipo.replaceAll('_', ' ')} · {new Date(alerta.createdAt).toLocaleDateString('es-PE')}
                                  </p>
                                </div>
                                <Badge tono={TONOS_ALERTA[alerta.estado] ?? 'neutro'}>
                                  {ETIQUETAS_ESTADO_ALERTA[alerta.estado as keyof typeof ETIQUETAS_ESTADO_ALERTA] ?? alerta.estado}
                                </Badge>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-2 text-xs text-on-surface-variant">Este local no tiene alertas registradas.</p>
                        )}
                        {(local._count?.alertas ?? 0) > (local.alertas?.length ?? 0) && (
                          <p className="mt-2 text-xs text-on-surface-variant">
                            Se muestran las 3 alertas más recientes de {local._count?.alertas} registradas.
                          </p>
                        )}
                      </section>
                      </div>
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
                  {puedeAdministrar && (
                    <div className="flex justify-end gap-2 border-t border-outline-variant/60 px-4 py-3">
                      <Boton variante="secundario" tamano="sm" onClick={() => { setLocalEditando(local); setFormularioAbierto(true); }}>
                        <Pencil size={14} /> Editar
                      </Boton>
                      <Boton variante="secundario" tamano="sm" onClick={() => setLocalEliminando(local)}>
                        <Trash2 size={14} /> Eliminar
                      </Boton>
                    </div>
                  )}
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
      <Modal
        abierto={formularioAbierto}
        onCerrar={() => setFormularioAbierto(false)}
        titulo={localEditando ? 'Editar local escolar' : 'Registrar local escolar'}
        ancho="xl"
      >
        <FormularioLocal
          key={localEditando?.id ?? 'nuevo'}
          inicial={localEditando ?? undefined}
          onExito={() => setFormularioAbierto(false)}
          onCancelar={() => setFormularioAbierto(false)}
        />
      </Modal>
      <Confirmacion
        abierto={localEliminando !== null}
        onCancelar={() => setLocalEliminando(null)}
        onConfirmar={() => { if (localEliminando) eliminar.mutate(localEliminando.id); }}
        cargando={eliminar.isPending}
        titulo="Eliminar local escolar"
        mensaje={localEliminando
          ? `¿Eliminar el local ${localEliminando.codigoLocal} de ${localEliminando.ie?.nombre ?? 'esta institución'}? Esta acción también eliminará las alertas asociadas y no se puede deshacer.`
          : ''}
      />
    </div>
  );
}

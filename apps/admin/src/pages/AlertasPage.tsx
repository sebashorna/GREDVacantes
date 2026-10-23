import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  FileImage,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import {
  ESTADOS_ALERTA,
  ETIQUETAS_ESTADO_ALERTA,
  TIPOS_ALERTA,
  type EstadoAlerta,
  type TipoAlerta,
} from '@shared';

import { EncabezadoPagina } from '@/components/EncabezadoPagina';
import { Badge, type TonoBadge } from '@/components/ui/Badge';
import { Boton } from '@/components/ui/Boton';
import { CampoArea, CampoSelect, CampoTexto } from '@/components/ui/Campo';
import { Confirmacion } from '@/components/ui/Confirmacion';
import { Modal } from '@/components/ui/Modal';
import { Paginacion } from '@/components/ui/Paginacion';
import { VistaPreviaArchivo } from '@/components/ui/VistaPreviaArchivo';
import { useAuth, mensajeDeError } from '@/features/auth/auth-context';
import { usePaginacion } from '@/hooks/usePaginacion';
import { api } from '@/lib/api';
import type { Alerta, Pagina } from '@/lib/tipos';

interface LocalOpcion {
  id: number;
  ieId: number;
  codigoLocal: string;
  ie?: { id: number; nombre: string } | null;
}

interface FormularioAlerta {
  tipo: TipoAlerta;
  descripcion: string;
  reportadoPor: string;
  telefonoReporte: string;
  fotos: string;
}

interface DatosAlerta {
  localEscolarId: number;
  ieId: number;
  tipo: TipoAlerta;
  descripcion: string;
  reportadoPor: string;
  telefonoReporte: string;
  fotos: string[];
}

interface DatosEstado {
  estado: EstadoAlerta;
  observacion: string;
}

const TIPO_ETIQUETAS: Record<TipoAlerta, string> = {
  FILTRACION: 'Filtración',
  AULA_DETERIORADA: 'Aula deteriorada',
  FALTA_AGUA: 'Falta de agua',
  FALTA_LUZ: 'Falta de energía eléctrica',
  OTRO: 'Otro',
};

const TONOS_ESTADO: Record<EstadoAlerta, TonoBadge> = {
  ABIERTA: 'error',
  EN_ATENCION: 'advertencia',
  RESUELTA: 'exito',
  DESCARTADA: 'neutro',
};

const TONOS_TIPO: Record<TipoAlerta, TonoBadge> = {
  FILTRACION: 'info',
  AULA_DETERIORADA: 'advertencia',
  FALTA_AGUA: 'info',
  FALTA_LUZ: 'neutro',
  OTRO: 'neutro',
};

const FORMULARIO_VACIO: FormularioAlerta = {
  tipo: 'FILTRACION',
  descripcion: '',
  reportadoPor: '',
  telefonoReporte: '',
  fotos: '',
};

function fechaHora(valor: string): string {
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime())
    ? 'Fecha no disponible'
    : fecha.toLocaleString('es-PE', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
}

function esUrlSegura(valor: string): boolean {
  try {
    const url = new URL(valor);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export function AlertasPage() {
  const { usuario, puede } = useAuth();
  const queryClient = useQueryClient();
  const { busqueda, setBusqueda, setPagina, params } = usePaginacion();
  const [fEstado, setFEstado] = useState('');
  const [fTipo, setFTipo] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [alertaEditando, setAlertaEditando] = useState<Alerta | null>(null);
  const [formulario, setFormulario] = useState<FormularioAlerta>(FORMULARIO_VACIO);
  const [localBusqueda, setLocalBusqueda] = useState('');
  const [localSeleccionado, setLocalSeleccionado] = useState<LocalOpcion | null>(null);
  const [alertaEliminando, setAlertaEliminando] = useState<Alerta | null>(null);
  const [alertaGestionando, setAlertaGestionando] = useState<Alerta | null>(null);
  const [datosEstado, setDatosEstado] = useState<DatosEstado>({
    estado: 'ABIERTA',
    observacion: '',
  });
  const puedeRegistrar = puede('ADMIN_GRED', 'EDITOR_UGEL');
  const puedeAdministrar = puede('ADMIN_GRED');

  const alertas = useQuery({
    queryKey: ['alertas', params, fEstado, fTipo],
    queryFn: async () => {
      const filtros = new URLSearchParams({
        page: String(params.page),
        limit: String(params.limit),
        ...(params.search ? { search: params.search } : {}),
        ...(fEstado ? { estado: fEstado } : {}),
        ...(fTipo ? { tipo: fTipo } : {}),
      });
      const { data } = await api.get<Pagina<Alerta>>(`/alertas?${filtros}`);
      return data;
    },
    enabled: !!usuario,
  });

  const locales = useQuery({
    queryKey: ['locales', 'selector-alertas', localBusqueda],
    queryFn: async () => {
      const filtros = new URLSearchParams({ page: '1', limit: '100' });
      if (localBusqueda.trim()) filtros.set('search', localBusqueda.trim());
      const { data } = await api.get<Pagina<LocalOpcion>>(`/locales?${filtros}`);
      return data;
    },
    enabled: !!usuario && modalAbierto,
  });

  const guardarAlerta = useMutation({
    mutationFn: async ({ id, datos }: { id: number | null; datos: DatosAlerta }) => {
      if (id) {
        const { data } = await api.put<Alerta>(`/alertas/${id}`, datos);
        return data;
      }
      const { data } = await api.post<Alerta>('/alertas', datos);
      return data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['alertas'] });
      void queryClient.invalidateQueries({ queryKey: ['locales'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(variables.id ? 'Alerta actualizada' : 'Alerta creada');
      cerrarFormulario();
    },
    onError: (error) => toast.error(mensajeDeError(error)),
  });

  const eliminarAlerta = useMutation({
    mutationFn: (id: number) => api.delete(`/alertas/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['alertas'] });
      void queryClient.invalidateQueries({ queryKey: ['locales'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Alerta eliminada');
      setAlertaEliminando(null);
    },
    onError: (error) => toast.error(mensajeDeError(error)),
  });

  const cambiarEstado = useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: DatosEstado }) => {
      const { data } = await api.patch<Alerta>(`/alertas/${id}/estado`, datos);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['alertas'] });
      void queryClient.invalidateQueries({ queryKey: ['locales'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Seguimiento de alerta actualizado');
      setAlertaGestionando(null);
    },
    onError: (error) => toast.error(mensajeDeError(error)),
  });

  function cerrarFormulario() {
    setModalAbierto(false);
    setAlertaEditando(null);
    setFormulario(FORMULARIO_VACIO);
    setLocalBusqueda('');
    setLocalSeleccionado(null);
  }

  function abrirNuevaAlerta() {
    setAlertaEditando(null);
    setFormulario(FORMULARIO_VACIO);
    setLocalBusqueda('');
    setLocalSeleccionado(null);
    setModalAbierto(true);
  }

  function abrirEdicion(alerta: Alerta) {
    setAlertaEditando(alerta);
    setFormulario({
      tipo: alerta.tipo as TipoAlerta,
      descripcion: alerta.descripcion,
      reportadoPor: alerta.reportadoPor,
      telefonoReporte: alerta.telefonoReporte ?? '',
      fotos: (alerta.fotos ?? []).join('\n'),
    });
    setLocalSeleccionado(
      alerta.localEscolar && alerta.ie
        ? {
            id: alerta.localEscolar.id,
            ieId: alerta.ie.id,
            codigoLocal: alerta.localEscolar.codigoLocal,
            ie: { id: alerta.ie.id, nombre: alerta.ie.nombre },
          }
        : null,
    );
    setLocalBusqueda(alerta.localEscolar?.codigoLocal ?? '');
    setModalAbierto(true);
  }

  function enviarFormulario(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!localSeleccionado) {
      toast.error('Seleccione el local escolar relacionado con la alerta.');
      return;
    }

    const fotos = formulario.fotos
      .split(/\r?\n/)
      .map((foto) => foto.trim())
      .filter(Boolean);
    if (fotos.length > 10) {
      toast.error('Puede registrar como máximo 10 enlaces de evidencia.');
      return;
    }

    guardarAlerta.mutate({
      id: alertaEditando?.id ?? null,
      datos: {
        localEscolarId: localSeleccionado.id,
        ieId: localSeleccionado.ieId,
        tipo: formulario.tipo,
        descripcion: formulario.descripcion,
        reportadoPor: formulario.reportadoPor,
        telefonoReporte: formulario.telefonoReporte,
        fotos,
      },
    });
  }

  function abrirGestionEstado(alerta: Alerta) {
    setAlertaGestionando(alerta);
    setDatosEstado({
      estado: alerta.estado as EstadoAlerta,
      observacion: alerta.observacion ?? '',
    });
  }

  const selectClase =
    'h-12 w-full rounded-lg border-[1.5px] border-outline-variant bg-white px-3.5 text-on-surface outline-none focus:border-primary-container focus:shadow-[0_0_0_3px_rgba(160,71,46,0.15)]';

  return (
    <div className="space-y-6">
      <EncabezadoPagina
        titulo="Alertas e incidencias"
        descripcion="Reportes de daños y problemas de servicios en aulas y locales escolares."
        accion={
          puedeRegistrar
            ? { etiqueta: 'Registrar alerta', onClick: abrirNuevaAlerta }
            : undefined
        }
      />

      <section className="space-y-3 rounded-xl border border-outline-variant bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search
              size={18}
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              type="search"
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              placeholder="Buscar por institución, local, reportante o descripción..."
              aria-label="Buscar alertas"
              className="h-12 w-full rounded-lg border-[1.5px] border-outline-variant bg-white pl-10 pr-10 text-sm outline-none placeholder:text-on-surface-variant/70 focus:border-primary-container"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                aria-label="Limpiar búsqueda"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
              >
                <X size={17} />
              </button>
            )}
          </div>
          <select
            aria-label="Filtrar alertas por estado"
            value={fEstado}
            onChange={(evento) => {
              setFEstado(evento.target.value);
              setPagina(1);
            }}
            className={`${selectClase} lg:max-w-xs`}
          >
            <option value="">Todos los estados</option>
            {ESTADOS_ALERTA.map((estado) => (
              <option key={estado} value={estado}>
                {ETIQUETAS_ESTADO_ALERTA[estado]}
              </option>
            ))}
          </select>
          <select
            aria-label="Filtrar alertas por tipo"
            value={fTipo}
            onChange={(evento) => {
              setFTipo(evento.target.value);
              setPagina(1);
            }}
            className={`${selectClase} lg:max-w-xs`}
          >
            <option value="">Todos los tipos</option>
            {TIPOS_ALERTA.map((tipo) => (
              <option key={tipo} value={tipo}>
                {TIPO_ETIQUETAS[tipo]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/60 pt-3">
          <p className="text-sm text-on-surface-variant">
            Revisa el tipo de incidencia, el local afectado, su estado y la información de contacto del reportante.
          </p>
          <p className="text-sm font-semibold text-primary">
            {alertas.isLoading
              ? 'Cargando alertas...'
              : `${alertas.data?.meta.total ?? 0} alertas encontradas`}
          </p>
        </div>
      </section>

      <section className="space-y-3" aria-label="Listado de alertas">
        {alertas.isError ? (
          <p
            role="alert"
            className="rounded-xl border border-error/30 bg-error-container p-5 text-center text-sm text-on-error-container"
          >
            No se pudieron cargar las alertas: {mensajeDeError(alertas.error)}
          </p>
        ) : alertas.isLoading ? (
          <p className="rounded-xl border border-outline-variant bg-white p-8 text-center text-sm text-on-surface-variant">
            Cargando alertas...
          </p>
        ) : (alertas.data?.data.length ?? 0) === 0 ? (
          <div className="rounded-xl border border-dashed border-outline-variant bg-white p-10 text-center">
            <AlertTriangle className="mx-auto h-9 w-9 text-outline" />
            <p className="mt-3 font-semibold text-on-surface">No hay alertas para mostrar</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              Prueba cambiando los filtros{puedeRegistrar ? ' o registra una nueva alerta' : ''}.
            </p>
          </div>
        ) : (
          <>
            {alertas.data?.data.map((alerta) => (
              <article
                key={alerta.id}
                className="rounded-xl border border-outline-variant bg-white p-4 shadow-sm sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tono={TONOS_ESTADO[alerta.estado as EstadoAlerta] ?? 'neutro'}>
                        {ETIQUETAS_ESTADO_ALERTA[alerta.estado as EstadoAlerta] ?? alerta.estado}
                      </Badge>
                      <Badge tono={TONOS_TIPO[alerta.tipo as TipoAlerta] ?? 'neutro'}>
                        {TIPO_ETIQUETAS[alerta.tipo as TipoAlerta] ?? alerta.tipo}
                      </Badge>
                      {alerta.localEscolar && (
                        <span className="text-xs font-semibold text-on-surface-variant">
                          Local {alerta.localEscolar.codigoLocal}
                        </span>
                      )}
                    </div>
                    <h2 className="mt-2 text-base font-semibold text-on-surface">
                      {alerta.ie?.nombre ?? `Institución educativa #${alerta.ie?.id ?? ''}`}
                    </h2>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-on-surface-variant">
                      {alerta.descripcion}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5 text-xs text-on-surface-variant sm:justify-end">
                    <CalendarClock size={15} />
                    <time dateTime={alerta.createdAt}>{fechaHora(alerta.createdAt)}</time>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 rounded-lg bg-surface-container-low p-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  <div className="flex min-w-0 items-start gap-2">
                    <Building2 size={16} className="mt-0.5 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <p className="text-xs text-on-surface-variant">Local escolar</p>
                      <p className="font-semibold text-on-surface">
                        {alerta.localEscolar?.codigoLocal ?? 'Sin local'} ·{' '}
                        {alerta.localEscolar
                          ? `${alerta.localEscolar.aulasOperativas}/${alerta.localEscolar.aulasTotales} aulas operativas`
                          : 'Sin detalle'}
                      </p>
                    </div>
                  </div>
                  <div className="flex min-w-0 items-start gap-2">
                    <UserRound size={16} className="mt-0.5 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <p className="text-xs text-on-surface-variant">Reportado por</p>
                      <p className="truncate font-semibold text-on-surface">{alerta.reportadoPor}</p>
                    </div>
                  </div>
                  <div className="flex min-w-0 items-start gap-2">
                    <MapPin size={16} className="mt-0.5 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <p className="text-xs text-on-surface-variant">Código modular</p>
                      <p className="font-semibold text-on-surface">{alerta.ie?.codigoModular ?? 'Sin registro'}</p>
                    </div>
                  </div>
                  {alerta.telefonoReporte && (
                    <a
                      href={`tel:${alerta.telefonoReporte}`}
                      className="flex items-center gap-2 font-semibold text-primary hover:underline"
                    >
                      <Phone size={16} /> {alerta.telefonoReporte}
                    </a>
                  )}
                  {alerta.observacion && (
                    <p className="sm:col-span-2">
                      <span className="font-semibold text-on-surface">Seguimiento: </span>
                      <span className="text-on-surface-variant">{alerta.observacion}</span>
                    </p>
                  )}
                </div>

                {alerta.fotos?.length > 0 && (
                  <div className="mt-3">
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant">
                      <FileImage size={15} /> Evidencias ({alerta.fotos.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {alerta.fotos.map((foto, indice) =>
                        esUrlSegura(foto) ? (
                          <VistaPreviaArchivo
                            key={`${foto}-${indice}`}
                            url={foto}
                            titulo={`Evidencia ${indice + 1} de la alerta`}
                            tipo="imagen"
                          >
                            <span className="block h-20 w-24 overflow-hidden rounded-lg border border-outline-variant bg-surface-container-low transition hover:ring-2 hover:ring-primary">
                              <img
                                src={foto}
                                alt={`Miniatura de evidencia ${indice + 1}`}
                                loading="lazy"
                                className="h-full w-full object-cover"
                              />
                            </span>
                          </VistaPreviaArchivo>
                        ) : (
                          <span key={`${foto}-${indice}`} className="text-xs text-on-surface-variant">
                            {foto}
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                )}

                {puedeAdministrar && (
                  <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-outline-variant/60 pt-3">
                    <Boton
                      variante="secundario"
                      tamano="sm"
                      onClick={() => abrirGestionEstado(alerta)}
                    >
                      Gestionar estado
                    </Boton>
                    <Boton
                      variante="secundario"
                      tamano="sm"
                      onClick={() => abrirEdicion(alerta)}
                    >
                      <Pencil size={14} /> Editar
                    </Boton>
                    <Boton
                      variante="peligro"
                      tamano="sm"
                      onClick={() => setAlertaEliminando(alerta)}
                    >
                      <Trash2 size={14} /> Eliminar
                    </Boton>
                  </div>
                )}
              </article>
            ))}
            {alertas.data && (
              <Paginacion
                pagina={alertas.data.meta.page}
                totalPaginas={alertas.data.meta.totalPages}
                total={alertas.data.meta.total}
                onPagina={setPagina}
                cargando={alertas.isFetching}
              />
            )}
          </>
        )}
      </section>

      <Modal
        abierto={modalAbierto}
        onCerrar={cerrarFormulario}
        titulo={alertaEditando ? 'Editar alerta' : 'Registrar alerta'}
      >
        <form className="space-y-4" onSubmit={enviarFormulario}>
          <div className="space-y-2">
            <label htmlFor="busqueda-local-alerta" className="block text-label">
              Buscar local escolar
            </label>
            <div className="relative">
              <Search
                size={17}
                aria-hidden="true"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
              />
              <input
                id="busqueda-local-alerta"
                value={localBusqueda}
                onChange={(evento) => setLocalBusqueda(evento.target.value)}
                placeholder="Nombre de institución o código local..."
                className="h-12 w-full rounded-lg border-[1.5px] border-outline-variant bg-white pl-10 pr-3 text-sm outline-none focus:border-primary-container"
              />
            </div>
            {locales.isError && (
              <p role="alert" className="text-sm text-error">
                No se pudieron cargar los locales: {mensajeDeError(locales.error)}
              </p>
            )}
            {locales.isLoading ? (
              <p className="text-xs text-on-surface-variant">Buscando locales...</p>
            ) : (
              <select
                aria-label="Seleccionar local escolar"
                value={localSeleccionado?.id ?? ''}
                onChange={(evento) => {
                  const seleccionado = locales.data?.data.find(
                    (local) => String(local.id) === evento.target.value,
                  );
                  if (seleccionado) setLocalSeleccionado(seleccionado);
                }}
                className={selectClase}
              >
                <option value="">Seleccione el local afectado</option>
                {localSeleccionado &&
                  !locales.data?.data.some((local) => local.id === localSeleccionado.id) && (
                    <option value={localSeleccionado.id}>
                      {localSeleccionado.codigoLocal} · {localSeleccionado.ie?.nombre ?? 'Institución educativa'}
                    </option>
                  )}
                {(locales.data?.data ?? []).map((local) => (
                  <option key={local.id} value={local.id}>
                    {local.codigoLocal} · {local.ie?.nombre ?? `Institución #${local.ieId}`}
                  </option>
                ))}
              </select>
            )}
            {localSeleccionado && (
              <p className="text-xs text-on-surface-variant">
                Institución: {localSeleccionado.ie?.nombre ?? 'Institución educativa'} · Código local:{' '}
                {localSeleccionado.codigoLocal}
              </p>
            )}
          </div>

          <CampoSelect
            etiqueta="Tipo de incidencia"
            valor={formulario.tipo}
            onChange={(valor) =>
              setFormulario((actual) => ({ ...actual, tipo: valor as TipoAlerta }))
            }
            opciones={TIPOS_ALERTA.map((tipo) => ({
              valor: tipo,
              etiqueta: TIPO_ETIQUETAS[tipo],
            }))}
          />
          <CampoArea
            etiqueta="Descripción del problema"
            valor={formulario.descripcion}
            onChange={(descripcion) => setFormulario((actual) => ({ ...actual, descripcion }))}
            placeholder="Describe el daño o problema observado, dónde ocurre y cualquier detalle útil..."
            filas={4}
            ayuda="Incluye detalles que ayuden a identificar y atender la incidencia."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <CampoTexto
              etiqueta="Nombre de quien reporta"
              valor={formulario.reportadoPor}
              onChange={(reportadoPor) =>
                setFormulario((actual) => ({ ...actual, reportadoPor }))
              }
              placeholder="Nombre completo"
            />
            <CampoTexto
              etiqueta="Teléfono de contacto (opcional)"
              valor={formulario.telefonoReporte}
              onChange={(telefonoReporte) =>
                setFormulario((actual) => ({ ...actual, telefonoReporte }))
              }
              tipo="tel"
              placeholder="999 999 999"
            />
          </div>
          <CampoArea
            etiqueta="Enlaces a fotos o evidencias (opcional)"
            valor={formulario.fotos}
            onChange={(fotos) => setFormulario((actual) => ({ ...actual, fotos }))}
            placeholder={'https://... (un enlace por línea)'}
            filas={2}
            ayuda="Hasta 10 enlaces, uno por línea."
          />
          <div className="flex justify-end gap-2 border-t border-outline-variant pt-4">
            <Boton variante="secundario" onClick={cerrarFormulario} disabled={guardarAlerta.isPending}>
              Cancelar
            </Boton>
            <Boton type="submit" disabled={guardarAlerta.isPending || locales.isError}>
              <Plus size={16} />
              {guardarAlerta.isPending
                ? 'Guardando...'
                : alertaEditando
                  ? 'Guardar cambios'
                  : 'Registrar alerta'}
            </Boton>
          </div>
        </form>
      </Modal>

      <Modal
        abierto={alertaGestionando !== null}
        onCerrar={() => setAlertaGestionando(null)}
        titulo="Seguimiento de alerta"
      >
        <form
          className="space-y-4"
          onSubmit={(evento) => {
            evento.preventDefault();
            if (alertaGestionando) {
              cambiarEstado.mutate({ id: alertaGestionando.id, datos: datosEstado });
            }
          }}
        >
          <p className="text-sm text-on-surface-variant">
            Actualiza el estado de atención y deja una observación para el seguimiento.
          </p>
          <CampoSelect
            etiqueta="Estado"
            valor={datosEstado.estado}
            onChange={(valor) =>
              setDatosEstado((actual) => ({ ...actual, estado: valor as EstadoAlerta }))
            }
            opciones={ESTADOS_ALERTA.map((estado) => ({
              valor: estado,
              etiqueta: ETIQUETAS_ESTADO_ALERTA[estado],
            }))}
          />
          <CampoArea
            etiqueta="Observación de seguimiento"
            valor={datosEstado.observacion}
            onChange={(observacion) =>
              setDatosEstado((actual) => ({ ...actual, observacion }))
            }
            placeholder="Describe las acciones realizadas o los pasos pendientes..."
            filas={4}
          />
          <div className="flex justify-end gap-2 border-t border-outline-variant pt-4">
            <Boton
              variante="secundario"
              onClick={() => setAlertaGestionando(null)}
              disabled={cambiarEstado.isPending}
            >
              Cancelar
            </Boton>
            <Boton type="submit" disabled={cambiarEstado.isPending}>
              {cambiarEstado.isPending ? 'Guardando...' : 'Guardar seguimiento'}
            </Boton>
          </div>
        </form>
      </Modal>

      <Confirmacion
        abierto={alertaEliminando !== null}
        onCancelar={() => setAlertaEliminando(null)}
        onConfirmar={() => {
          if (alertaEliminando) eliminarAlerta.mutate(alertaEliminando.id);
        }}
        titulo="Eliminar alerta"
        mensaje={
          alertaEliminando
            ? `¿Eliminar el reporte de ${TIPO_ETIQUETAS[alertaEliminando.tipo as TipoAlerta] ?? 'esta incidencia'}? Esta acción no se puede deshacer.`
            : ''
        }
        cargando={eliminarAlerta.isPending}
      />
    </div>
  );
}

import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';
import { Check, CircleHelp, MapPin, Pencil, Phone, Search, Trash2, X } from 'lucide-react';
import { ESTADOS_VACANTE, ETIQUETAS_ESTADO_VACANTE, ETIQUETAS_NIVEL, ETIQUETAS_TURNO, NIVELES, TURNOS } from '@shared';
import { api } from '@/lib/api';
import type { Pagina, ResumenCupos, Vacante } from '@/lib/tipos';
import { mensajeDeError, useAuth } from '@/features/auth/auth-context';
import { usePaginacion } from '@/hooks/usePaginacion';
import { useInstitucionesOpciones } from '@/hooks/useCatalogos';
import { EncabezadoPagina } from '@/components/EncabezadoPagina';
import { Badge, type TonoBadge } from '@/components/ui/Badge';
import { Boton } from '@/components/ui/Boton';
import { CampoSelect, CampoTexto } from '@/components/ui/Campo';
import { Modal } from '@/components/ui/Modal';
import { Paginacion } from '@/components/ui/Paginacion';
import { Confirmacion } from '@/components/ui/Confirmacion';

const TONOS_ESTADO: Record<string, TonoBadge> = {
  LIBRE: 'exito', LISTA_ESPERA: 'advertencia', COMPLETO: 'info', CERRADO: 'neutro',
};
function fechaCorta(v: string | null): string {
  if (!v) return '-';
  return new Date(v).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function urlMapaVacante(vacante: Vacante): string {
  const ubicacion = [
    vacante.ie?.nombre,
    vacante.ie?.distrito?.nombre,
    vacante.ie?.provincia?.nombre,
    vacante.ie?.ugel?.nombre,
    'Lambayeque, Perú',
  ].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ubicacion)}`;
}
function telefonoVacante(vacante: Vacante): string {
  return vacante.ie?.telefono?.replace(/[^\d+]/g, '') ?? '';
}
function urlWhatsappVacante(vacante: Vacante): string {
  const digitos = vacante.ie?.whatsapp?.replace(/\D/g, '');
  if (!digitos || digitos.length < 9 || digitos.length > 15) return '';
  const internacional = digitos.length === 9 ? `51${digitos}` : digitos;
  const mensaje = `Hola, quisiera consultar sobre la matrícula de ${vacante.ie?.nombre ?? 'la institución'} para ${ETIQUETAS_NIVEL[vacante.nivel as keyof typeof ETIQUETAS_NIVEL] ?? vacante.nivel}.`;
  return `https://wa.me/${internacional}?text=${encodeURIComponent(mensaje)}`;
}
const formSchema = z.object({
  ieId: z.string().min(1, 'Seleccione una institucion'),
  nivel: z.enum(NIVELES),
  turno: z.enum(TURNOS),
  cupoTotal: z.coerce.number().int().min(0).max(1000),
  cupoDisponibles: z.coerce.number().int().min(0).max(1000),
  estado: z.enum(ESTADOS_VACANTE),
  fechaLimite: z.string().optional().or(z.literal('')),
}).refine((v) => v.cupoDisponibles <= v.cupoTotal, {
  message: 'Los disponibles no pueden superar el total', path: ['cupoDisponibles'],
});
type FormDatos = z.infer<typeof formSchema>;
interface FormularioProps {
  inicial?: Vacante;
  onExito: () => void;
  onCancelar: () => void;
}
function SelectorIE({
  valor,
  onChange,
  error,
  deshabilitado = false,
  busquedaInicial = '',
}: {
  valor: string;
  onChange: (v: string) => void;
  error?: string;
  deshabilitado?: boolean;
  busquedaInicial?: string;
}) {
  const [q, setQ] = useState('');
  const { data, isLoading } = useInstitucionesOpciones(q || busquedaInicial);
  return (
    <div className="space-y-2">
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrar institucion por nombre o codigo..."
        className="h-10 w-full px-3 rounded-lg border-[1.5px] border-outline-variant bg-white text-sm outline-none placeholder:text-on-surface-variant/60 focus:border-primary-container" />
      <CampoSelect etiqueta="Institucion educativa" valor={valor} onChange={onChange} error={error}
        ayuda={isLoading ? 'Buscando...' : `${data?.meta.total ?? 0} instituciones`}
        deshabilitado={deshabilitado}
        opciones={(data?.data ?? []).map((i) => ({ valor: String(i.id), etiqueta: `${i.nombre} (${i.codigoModular})` }))} />
    </div>
  );
}
function FormularioVacante({ inicial, onExito, onCancelar }: FormularioProps) {
  const queryClient = useQueryClient();
  const form = useForm<FormDatos>({
    resolver: zodResolver(formSchema),
    defaultValues: inicial
      ? {
          ieId: String(inicial.ieId),
          nivel: inicial.nivel as (typeof NIVELES)[number],
          turno: inicial.turno as (typeof TURNOS)[number],
          cupoTotal: inicial.cupoTotal,
          cupoDisponibles: inicial.cupoDisponibles,
          estado: inicial.estado as (typeof ESTADOS_VACANTE)[number],
          fechaLimite: inicial.fechaLimite?.slice(0, 10) ?? '',
        }
      : {
          ieId: '', nivel: 'PRIMARIA', turno: 'MANANA',
          cupoTotal: 0, cupoDisponibles: 0, estado: 'LIBRE', fechaLimite: '',
        },
  });
  const guardar = useMutation({
    mutationFn: async (d: FormDatos) => {
      const cuerpo = {
        ieId: Number(d.ieId), nivel: d.nivel, turno: d.turno,
        cupoTotal: d.cupoTotal, cupoDisponibles: d.cupoDisponibles, estado: d.estado,
        fechaLimite: d.fechaLimite?.trim() ? new Date(`${d.fechaLimite}T23:59:59`).toISOString() : null,
      };
      const { data } = inicial
        ? await api.put(`/vacantes/${inicial.id}`, {
            nivel: cuerpo.nivel,
            turno: cuerpo.turno,
            cupoTotal: cuerpo.cupoTotal,
            cupoDisponibles: cuerpo.cupoDisponibles,
            estado: cuerpo.estado,
            fechaLimite: cuerpo.fechaLimite,
          })
        : await api.post('/vacantes', cuerpo);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacantes'] });
      toast.success(inicial ? 'Vacante actualizada' : 'Vacante creada');
      onExito();
    },
    onError: (e) => toast.error(mensajeDeError(e)),
  });
  const c = form.control;
  const enviar = form.handleSubmit((d) => guardar.mutate(d));
  return (
    <form onSubmit={enviar} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <Controller name="ieId" control={c} render={({ field, fieldState }) => (
          <SelectorIE
            valor={field.value}
            onChange={field.onChange}
            error={fieldState.error?.message}
            deshabilitado={Boolean(inicial)}
            busquedaInicial={inicial?.ie?.codigoModular ?? ''}
          />
        )} />
      </div>
      <Controller name="nivel" control={c} render={({ field, fieldState }) => (
        <CampoSelect etiqueta="Nivel" valor={field.value} onChange={field.onChange} error={fieldState.error?.message}
          opciones={NIVELES.map((n) => ({ valor: n, etiqueta: ETIQUETAS_NIVEL[n] }))} />
      )} />
      <Controller name="turno" control={c} render={({ field, fieldState }) => (
        <CampoSelect etiqueta="Turno" valor={field.value} onChange={field.onChange} error={fieldState.error?.message}
          opciones={TURNOS.map((t) => ({ valor: t, etiqueta: ETIQUETAS_TURNO[t] }))} />
      )} />
      <Controller name="cupoTotal" control={c} render={({ field, fieldState }) => (
        <CampoTexto etiqueta="Cupo total" tipo="number" min={0} max={1000} valor={String(field.value ?? '')} onChange={field.onChange} error={fieldState.error?.message} />
      )} />
      <Controller name="cupoDisponibles" control={c} render={({ field, fieldState }) => (
        <CampoTexto etiqueta="Cupos disponibles" tipo="number" min={0} max={1000} valor={String(field.value ?? '')} onChange={field.onChange} error={fieldState.error?.message} />
      )} />
      <Controller name="estado" control={c} render={({ field, fieldState }) => (
        <CampoSelect etiqueta="Estado" valor={field.value} onChange={field.onChange} error={fieldState.error?.message}
          opciones={ESTADOS_VACANTE.map((e) => ({ valor: e, etiqueta: ETIQUETAS_ESTADO_VACANTE[e] }))} />
      )} />
      <Controller name="fechaLimite" control={c} render={({ field, fieldState }) => (
        <CampoTexto etiqueta="Fecha limite (opcional)" tipo="date" valor={field.value ?? ''} onChange={field.onChange} error={fieldState.error?.message} />
      )} />
      <div className="md:col-span-2 flex justify-end gap-3 pt-2">
        <Boton variante="secundario" onClick={onCancelar} disabled={guardar.isPending}>Cancelar</Boton>
        <Boton type="submit" disabled={guardar.isPending}>{guardar.isPending ? 'Guardando...' : inicial ? 'Guardar cambios' : 'Crear vacante'}</Boton>
      </div>
    </form>
  );
}
export function VacantesPage() {
  const { puede } = useAuth();
  const queryClient = useQueryClient();
  const { busqueda, setBusqueda, setPagina, params } = usePaginacion();
  const [fNivel, setFNivel] = useState('');
  const [fEstado, setFEstado] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [vacanteEditando, setVacanteEditando] = useState<Vacante | null>(null);
  const [vacanteEliminando, setVacanteEliminando] = useState<Vacante | null>(null);
  const [contactoSeleccionado, setContactoSeleccionado] = useState<Vacante | null>(null);
  const puedeRegistrar = puede('ADMIN_GRED', 'EDITOR_UGEL');
  const puedeAdministrar = puede('ADMIN_GRED');
  const eliminar = useMutation({
    mutationFn: (id: number) => api.delete(`/vacantes/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['vacantes'] });
      toast.success('Vacante eliminada');
      setVacanteEliminando(null);
    },
    onError: (error) => toast.error(mensajeDeError(error)),
  });
  const consulta = useQuery({
    queryKey: ['vacantes', params, fNivel, fEstado],
    queryFn: async () => {
      const qp = new URLSearchParams({
        page: String(params.page), limit: String(params.limit),
        ...(params.search ? { search: params.search } : {}),
        ...(fNivel ? { nivel: fNivel } : {}),
        ...(fEstado ? { estado: fEstado } : {}),
      });
      const { data } = await api.get<Pagina<Vacante>>(`/vacantes?${qp}`);
      return data;
    },
  });
  const resumen = useQuery({
    queryKey: ['vacantes', 'resumen'],
    queryFn: async () => (await api.get<ResumenCupos>('/vacantes/resumen')).data,
  });
  const totalDisp = resumen.data?.porEstado.reduce((a, e) => a + (e._sum.cupoDisponibles ?? 0), 0) ?? 0;
  const totalCupo = resumen.data?.porEstado.reduce((a, e) => a + (e._sum.cupoTotal ?? 0), 0) ?? 0;
  const sel = 'h-12 px-3.5 rounded-lg border-[1.5px] border-outline-variant bg-white cursor-pointer';
  const contactoTelefono = contactoSeleccionado ? telefonoVacante(contactoSeleccionado) : '';
  const contactoWhatsapp = contactoSeleccionado ? urlWhatsappVacante(contactoSeleccionado) : '';
  return (
    <div className="space-y-6">
      <EncabezadoPagina
        titulo="Vacantes" descripcion="Vacantes de matricula por institucion educativa."
        accion={puedeRegistrar ? { etiqueta: 'Nueva vacante', onClick: () => { setVacanteEditando(null); setModalAbierto(true); } } : undefined}
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-white border border-outline-variant border-l-4 border-l-primary-container">
          <p className="text-sm text-on-surface-variant">Cupos disponibles</p>
          <p className="text-3xl font-bold text-primary">{resumen.isLoading ? '...' : totalDisp}</p>
        </div>
        <div className="p-5 rounded-xl bg-white border border-outline-variant border-l-4 border-l-primary-container">
          <p className="text-sm text-on-surface-variant">Cupo total</p>
          <p className="text-3xl font-bold text-primary">{resumen.isLoading ? '...' : totalCupo}</p>
        </div>
        <div className="p-5 rounded-xl bg-white border border-outline-variant border-l-4 border-l-primary-container">
          <p className="text-sm text-on-surface-variant">Registros</p>
          <p className="text-3xl font-bold text-primary">{consulta.data?.meta.total ?? '...'}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="relative w-full sm:max-w-sm">
          <Search
            size={18}
            aria-hidden="true"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
          />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar institución educativa..."
            className="h-12 w-full rounded-lg border-[1.5px] border-outline-variant bg-white pl-10 pr-10 outline-none placeholder:text-on-surface-variant/60 focus:border-primary-container"
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
        <select
          aria-label="Filtrar por estado"
          value={fEstado}
          onChange={(e) => { setFEstado(e.target.value); setPagina(1); }}
          className={sel}
        >
          <option value="">Todos los estados</option>
          {ESTADOS_VACANTE.map((e) => <option key={e} value={e}>{ETIQUETAS_ESTADO_VACANTE[e]}</option>)}
        </select>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          aria-pressed={!fNivel}
          onClick={() => { setFNivel(''); setPagina(1); }}
          className={`shrink-0 rounded-lg border px-3.5 py-2 text-sm font-medium transition ${
            !fNivel
              ? 'border-primary-container bg-primary-container text-on-primary'
              : 'border-outline-variant bg-white text-on-surface-variant hover:bg-surface-container-low'
          }`}
        >
          {!fNivel && <Check size={15} className="mr-1 inline" />}
          Todos
        </button>
        {NIVELES.map((nivel) => {
          const activo = fNivel === nivel;
          return (
            <button
              key={nivel}
              type="button"
              aria-pressed={activo}
              onClick={() => { setFNivel(activo ? '' : nivel); setPagina(1); }}
              className={`shrink-0 rounded-lg border px-3.5 py-2 text-sm font-medium transition ${
                activo
                  ? 'border-primary-container bg-primary-container text-on-primary'
                  : 'border-outline-variant bg-white text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              {ETIQUETAS_NIVEL[nivel]}
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-on-surface-variant">Seleccione una vacante para ver sus datos.</p>
        <span className="shrink-0 text-sm font-semibold text-primary">
          {consulta.isLoading ? 'Cargando...' : `${consulta.data?.meta.total ?? 0} vacantes registradas`}
        </span>
      </div>
      <div className="space-y-3">
        {consulta.isError ? (
          <p role="alert" className="rounded-xl border border-error/30 bg-error-container p-5 text-center text-sm text-on-error-container">
            Error al cargar las vacantes: {mensajeDeError(consulta.error)}
          </p>
        ) : consulta.isLoading ? (
          <p className="rounded-xl border border-outline-variant bg-white p-8 text-center text-sm text-on-surface-variant">
            Cargando vacantes...
          </p>
        ) : (consulta.data?.data.length ?? 0) === 0 ? (
          <p className="rounded-xl border border-outline-variant bg-white p-8 text-center text-sm text-on-surface-variant">
            No hay vacantes que coincidan con los filtros.
          </p>
        ) : (
          <>
            {consulta.data?.data.map((vacante) => {
              const tono = TONOS_ESTADO[vacante.estado] ?? 'neutro';
              const estado = ETIQUETAS_ESTADO_VACANTE[
                vacante.estado as keyof typeof ETIQUETAS_ESTADO_VACANTE
              ] ?? vacante.estado;
              const completo = vacante.cupoDisponibles === 0
                || vacante.estado === 'COMPLETO'
                || vacante.estado === 'LISTA_ESPERA';
              const cerrado = vacante.estado === 'CERRADO';
              const sinDisponibilidad = completo || cerrado;
              const fechaLimite = fechaCorta(vacante.fechaLimite);
              const urlMapa = urlMapaVacante(vacante);

              return (
                <article
                  key={vacante.id}
                  className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-sm"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-base font-semibold leading-snug text-on-surface">
                        {vacante.ie?.nombre ?? `I.E. #${vacante.ieId}`}
                      </h2>
                      <span className="shrink-0 text-right text-xs font-semibold text-primary">
                        Cód. N.º
                        <br />
                        {vacante.ie?.codigoModular ?? '—'}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
                      <dl className="space-y-1 text-sm text-on-surface-variant">
                        <div>
                          <dt className="inline font-semibold text-on-surface">Nivel educativo: </dt>
                          <dd className="inline">
                            {ETIQUETAS_NIVEL[vacante.nivel as keyof typeof ETIQUETAS_NIVEL] ?? vacante.nivel}
                          </dd>
                        </div>
                        <div>
                          <dt className="inline font-semibold text-on-surface">Turno: </dt>
                          <dd className="inline">
                            {ETIQUETAS_TURNO[vacante.turno as keyof typeof ETIQUETAS_TURNO] ?? vacante.turno}
                          </dd>
                        </div>
                        {vacante.ie?.provincia?.nombre && (
                          <div>
                            <dt className="inline font-semibold text-on-surface">Provincia: </dt>
                            <dd className="inline">{vacante.ie.provincia.nombre}</dd>
                          </div>
                        )}
                        {vacante.ie?.distrito?.nombre && (
                          <div>
                            <dt className="inline font-semibold text-on-surface">Distrito: </dt>
                            <dd className="inline">{vacante.ie.distrito.nombre}</dd>
                          </div>
                        )}
                        {fechaLimite !== '-' && (
                          <div>
                            <dt className="inline font-semibold text-on-surface">Fecha límite: </dt>
                            <dd className="inline">{fechaLimite}</dd>
                          </div>
                        )}
                      </dl>

                      <div className="ml-auto text-right">
                        <p className={`whitespace-nowrap text-2xl font-bold leading-none tracking-tight ${
                          completo ? 'text-on-surface' : 'text-primary'
                        }`}>
                          {vacante.cupoDisponibles}
                          <span className="font-medium text-on-surface-variant"> / {vacante.cupoTotal}</span>
                        </p>
                        <p className={`mt-1.5 text-xs font-bold uppercase tracking-wide ${
                          completo ? 'text-error' : 'text-secondary'
                        }`}>
                          {cerrado ? 'Matrícula cerrada' : completo ? 'Cupo completo' : 'Vacantes libres'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <Badge tono={tono}>{estado}</Badge>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 border-t border-outline-variant/60 bg-surface-container-low/70 px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {sinDisponibilidad ? (
                        <>
                          <Boton
                            variante="secundario"
                            className="min-w-0 flex-1"
                            disabled
                            aria-disabled="true"
                          >
                            <CircleHelp size={16} />
                            {cerrado ? 'Matrícula cerrada' : 'Lista de Espera / Consultar'}
                          </Boton>
                          <a
                            href={urlMapa}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Ver ubicación de ${vacante.ie?.nombre ?? 'la institución'} en Google Maps`}
                            title="Ver ubicación en Google Maps"
                            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white text-primary shadow-sm transition hover:bg-surface-container-high"
                          >
                            <MapPin size={19} />
                          </a>
                        </>
                      ) : (
                        <>
                          <Boton
                            className="min-w-0 flex-1"
                            onClick={() => setContactoSeleccionado(vacante)}
                          >
                            <Phone size={16} />
                            Contactar I.E. / Matrícula
                          </Boton>
                          <a
                            href={urlMapa}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Ver ubicación de ${vacante.ie?.nombre ?? 'la institución'} en Google Maps`}
                            title="Ver ubicación en Google Maps"
                            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white text-primary shadow-sm transition hover:bg-surface-container-high"
                          >
                            <MapPin size={19} />
                          </a>
                        </>
                      )}
                    </div>
                    {sinDisponibilidad && (
                      <p className="text-xs text-on-surface-variant">
                        {cerrado
                          ? 'El periodo de matrícula de esta vacante figura como cerrado.'
                          : 'No quedan cupos disponibles. Consulta con la institución o la UGEL; la lista de espera no garantiza una vacante.'}
                      </p>
                    )}
                  </div>
                  {puedeAdministrar && (
                    <div className="flex justify-end gap-2 border-t border-outline-variant/60 px-4 py-3">
                      <Boton variante="secundario" tamano="sm" onClick={() => { setVacanteEditando(vacante); setModalAbierto(true); }}>
                        <Pencil size={14} /> Editar
                      </Boton>
                      <Boton variante="secundario" tamano="sm" onClick={() => setVacanteEliminando(vacante)}>
                        <Trash2 size={14} /> Eliminar
                      </Boton>
                    </div>
                  )}
                </article>
              );
            })}
            {consulta.data && (
              <Paginacion pagina={consulta.data.meta.page} totalPaginas={consulta.data.meta.totalPages}
                total={consulta.data.meta.total} onPagina={setPagina} cargando={consulta.isFetching} />
            )}
          </>
        )}
      </div>
      <aside className="flex items-start gap-4 rounded-xl border border-outline-variant bg-white p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary">
          <MapPin size={20} />
        </span>
        <div>
          <h2 className="font-semibold text-on-surface">Mesa de Ayuda - Matrícula Lambayeque</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            La asignación y reserva de vacantes es gratuita y está normada por la Gerencia Regional
            de Educación (GRED).
          </p>
          <a href="tel:+5174201928" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            Llamar a GRED Lambayeque (074) 20-1928
          </a>
        </div>
      </aside>
      <Modal
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        titulo={vacanteEditando ? 'Editar vacante' : 'Nueva vacante'}
      >
        <FormularioVacante
          key={vacanteEditando?.id ?? 'nueva'}
          inicial={vacanteEditando ?? undefined}
          onExito={() => setModalAbierto(false)} onCancelar={() => setModalAbierto(false)} />
      </Modal>
      <Confirmacion
        abierto={vacanteEliminando !== null}
        onCancelar={() => setVacanteEliminando(null)}
        onConfirmar={() => { if (vacanteEliminando) eliminar.mutate(vacanteEliminando.id); }}
        cargando={eliminar.isPending}
        titulo="Eliminar vacante"
        mensaje={vacanteEliminando ? `¿Eliminar el registro de ${vacanteEliminando.ie?.nombre ?? 'esta institución'}? Esta acción no se puede deshacer.` : ''}
      />
      <Modal
        abierto={contactoSeleccionado !== null}
        onCerrar={() => setContactoSeleccionado(null)}
        titulo="Contactar para matrícula"
        ancho="md"
      >
        {contactoSeleccionado && (
          <div className="space-y-4">
            <div>
              <h2 className="font-semibold text-on-surface">
                {contactoSeleccionado.ie?.nombre ?? `I.E. #${contactoSeleccionado.ieId}`}
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                {ETIQUETAS_NIVEL[contactoSeleccionado.nivel as keyof typeof ETIQUETAS_NIVEL] ?? contactoSeleccionado.nivel}
                {' · '}
                {ETIQUETAS_TURNO[contactoSeleccionado.turno as keyof typeof ETIQUETAS_TURNO] ?? contactoSeleccionado.turno}
              </p>
            </div>
            <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4 text-sm text-on-surface-variant">
              <p className="font-semibold text-on-surface">Pasos sugeridos</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                <li>Comunícate con la institución para confirmar requisitos y disponibilidad.</li>
                <li>Ten a mano el DNI del estudiante y la Ficha Única de Matrícula (FUM), si corresponde.</li>
                <li>La matrícula es gratuita; realiza el trámite directamente con la institución.</li>
              </ol>
            </div>
            <div className="space-y-2">
              {contactoWhatsapp && (
                <a
                  href={contactoWhatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-12 items-center justify-center gap-2 rounded-lg bg-primary-container px-4 text-sm font-semibold text-white hover:bg-primary"
                >
                  <Phone size={16} /> Escribir por WhatsApp
                </a>
              )}
              {contactoTelefono && (
                <a
                  href={`tel:${contactoTelefono}`}
                  className="flex h-12 items-center justify-center gap-2 rounded-lg border border-outline-variant px-4 text-sm font-semibold text-primary hover:bg-surface-container-low"
                >
                  <Phone size={16} /> Llamar a la institución · {contactoSeleccionado.ie?.telefono}
                </a>
              )}
              {!contactoWhatsapp && !contactoTelefono && (
                <p className="rounded-lg border border-outline-variant p-3 text-sm text-on-surface-variant">
                  La institución no tiene un teléfono de contacto registrado. Comunícate con la UGEL correspondiente o con la Mesa de Ayuda de Matrícula Lambayeque.
                </p>
              )}
              <a
                href={urlMapaVacante(contactoSeleccionado)}
                target="_blank"
                rel="noreferrer"
                className="flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-semibold text-primary hover:bg-surface-container-low"
              >
                <MapPin size={16} /> Ver ubicación en Google Maps
              </a>
            </div>
            <p className="border-t border-outline-variant pt-3 text-xs text-on-surface-variant">
              Mesa de Ayuda GRED Lambayeque: <a href="tel:+5174201928" className="font-semibold text-primary hover:underline">(074) 20-1928</a>
            </p>
            <div className="flex justify-end">
              <Boton variante="secundario" onClick={() => setContactoSeleccionado(null)}>
                Cerrar
              </Boton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';
import { Check, CircleHelp, MapPin, Search, X } from 'lucide-react';
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
import { Confirmacion } from '@/components/ui/Confirmacion';
import { Modal } from '@/components/ui/Modal';
import { Paginacion } from '@/components/ui/Paginacion';

const TONOS_ESTADO: Record<string, TonoBadge> = {
  LIBRE: 'exito', LISTA_ESPERA: 'advertencia', COMPLETO: 'info', CERRADO: 'neutro',
};
function fechaCorta(v: string | null): string {
  if (!v) return '-';
  return new Date(v).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
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
function SelectorIE({ valor, onChange, error }: { valor: string; onChange: (v: string) => void; error?: string }) {
  const [q, setQ] = useState('');
  const { data, isLoading } = useInstitucionesOpciones(q);
  return (
    <div className="space-y-2">
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrar institucion por nombre o codigo..."
        className="h-10 w-full px-3 rounded-lg border-[1.5px] border-outline-variant bg-white text-sm outline-none placeholder:text-on-surface-variant/60 focus:border-primary-container" />
      <CampoSelect etiqueta="Institucion educativa" valor={valor} onChange={onChange} error={error}
        ayuda={isLoading ? 'Buscando...' : `${data?.meta.total ?? 0} instituciones`}
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
          ieId: String(inicial.ieId), nivel: inicial.nivel as FormDatos['nivel'],
          turno: inicial.turno as FormDatos['turno'],
          cupoTotal: inicial.cupoTotal, cupoDisponibles: inicial.cupoDisponibles,
          estado: inicial.estado as FormDatos['estado'],
          fechaLimite: inicial.fechaLimite ? inicial.fechaLimite.slice(0, 10) : '',
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
        ? await api.put(`/vacantes/${inicial.id}`, cuerpo)
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
        {inicial
          ? <CampoTexto etiqueta="Institucion educativa" tipo="text" valor={inicial.ie ? `${inicial.ie.nombre} (${inicial.ie.codigoModular})` : `IE #${inicial.ieId}`} onChange={() => undefined} deshabilitado />
          : <Controller name="ieId" control={c} render={({ field, fieldState }) => (
              <SelectorIE valor={field.value} onChange={field.onChange} error={fieldState.error?.message} />
            )} />}
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
  const [editando, setEditando] = useState<Vacante | undefined>();
  const [eliminando, setEliminando] = useState<Vacante | null>(null);
  const puedeEscribir = puede('ADMIN_GRED', 'EDITOR_UGEL');
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
  const eliminar = useMutation({
    mutationFn: (id: number) => api.delete(`/vacantes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacantes'] });
      toast.success('Vacante eliminada');
      setEliminando(null);
    },
    onError: (e) => toast.error(mensajeDeError(e)),
  });
  const totalDisp = resumen.data?.porEstado.reduce((a, e) => a + (e._sum.cupoDisponibles ?? 0), 0) ?? 0;
  const totalCupo = resumen.data?.porEstado.reduce((a, e) => a + (e._sum.cupoTotal ?? 0), 0) ?? 0;
  const sel = 'h-12 px-3.5 rounded-lg border-[1.5px] border-outline-variant bg-white cursor-pointer';
  return (
    <div className="space-y-6">
      <EncabezadoPagina
        titulo="Vacantes" descripcion="Vacantes de matricula por institucion educativa."
        accion={puedeEscribir ? { etiqueta: 'Nueva vacante', onClick: () => { setEditando(undefined); setModalAbierto(true); } } : undefined}
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
              const completo = vacante.cupoDisponibles === 0;
              const fechaLimite = fechaCorta(vacante.fechaLimite);

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
                        {vacante.ie?.ugel?.nombre && (
                          <div>
                            <dt className="inline font-semibold text-on-surface">UGEL: </dt>
                            <dd className="inline">{vacante.ie.ugel.nombre}</dd>
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
                          {completo ? 'Cupo completo' : 'Vacantes libres'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <Badge tono={tono}>{estado}</Badge>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/60 bg-surface-container-low/70 px-4 py-3">
                    <span className="flex items-center gap-2 text-sm text-on-surface-variant">
                      {completo
                        ? <CircleHelp size={17} className="text-error" />
                        : <Check size={17} className="text-tertiary" />}
                      {completo ? 'Consulte disponibilidad en la institución' : 'Vacantes disponibles'}
                    </span>
                    {puedeEscribir && (
                      <div className="flex gap-2">
                        <Boton
                          variante="secundario"
                          tamano="sm"
                          onClick={() => { setEditando(vacante); setModalAbierto(true); }}
                        >
                          Editar
                        </Boton>
                        <Boton
                          variante="secundario"
                          tamano="sm"
                          onClick={() => setEliminando(vacante)}
                        >
                          Eliminar
                        </Boton>
                      </div>
                    )}
                  </div>
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
      <Modal abierto={modalAbierto} onCerrar={() => setModalAbierto(false)} titulo={editando ? 'Editar vacante' : 'Nueva vacante'}>
        <FormularioVacante key={editando?.id ?? 'nueva'} inicial={editando}
          onExito={() => setModalAbierto(false)} onCancelar={() => setModalAbierto(false)} />
      </Modal>
      <Confirmacion abierto={eliminando !== null} onCancelar={() => setEliminando(null)}
        onConfirmar={() => eliminando && eliminar.mutate(eliminando.id)} cargando={eliminar.isPending}
        titulo="Eliminar vacante"
        mensaje={eliminando ? `Eliminar la vacante de ${eliminando.ie?.nombre ?? `IE #${eliminando.ieId}`}?` : ''} />
    </div>
  );
}

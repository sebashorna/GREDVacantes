import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';
import { FileText, Megaphone, Search } from 'lucide-react';
import { FASES_CONVOCATORIA } from '@shared';
import { api } from '@/lib/api';
import type { Convocatoria, Pagina } from '@/lib/tipos';
import { mensajeDeError, useAuth } from '@/features/auth/auth-context';
import { usePaginacion } from '@/hooks/usePaginacion';
import { EncabezadoPagina } from '@/components/EncabezadoPagina';
import { Badge, type TonoBadge } from '@/components/ui/Badge';
import { Boton } from '@/components/ui/Boton';
import { CampoArea, CampoSelect, CampoTexto } from '@/components/ui/Campo';
import { CampoCargaArchivo } from '@/components/ui/CampoCargaArchivo';
import { Confirmacion } from '@/components/ui/Confirmacion';
import { Modal } from '@/components/ui/Modal';
import { Paginacion } from '@/components/ui/Paginacion';
import { Tabla, type Columna } from '@/components/ui/Tabla';
import { VistaPreviaArchivo } from '@/components/ui/VistaPreviaArchivo';
import { PanelFiltros } from '@/components/ui/PanelFiltros';

const ETIQUETAS_FASE: Record<string, string> = {
  INSCRIPCION: 'Inscripcion', ADJUDICACION: 'Adjudicacion',
  CONTRATACION: 'Contratacion', FINALIZADA: 'Finalizada',
};
const TONOS_FASE: Record<string, TonoBadge> = {
  INSCRIPCION: 'info', ADJUDICACION: 'advertencia',
  CONTRATACION: 'exito', FINALIZADA: 'neutro',
};
function fechaCorta(v: string): string {
  return new Date(v).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
const formSchema = z.object({
  titulo: z.string().trim().min(5, 'El titulo es obligatorio').max(200),
  numeroRD: z
    .string()
    .trim()
    .min(1, 'El numero de R.D. es obligatorio')
    .max(50)
    .regex(
      /^(?:R\.?\s*D\.?\s*N?[°º]?\s*[\d\-/]+|R\.?\s*D\.?\s+DEMO-\d{4}-\d+)$/i,
      'Formato de resolución inválido (ej: R.D. Nº 00412-2025)',
    ),
  descripcion: z.string().trim().max(2000).optional().or(z.literal('')),
  fase: z.enum(FASES_CONVOCATORIA),
  fechaInicio: z.string().min(1, 'La fecha de inicio es obligatoria'),
  fechaFin: z.string().min(1, 'La fecha de fin es obligatoria'),
  pdfMeritosUrl: z.string().trim().optional(),
  activo: z.enum(['true', 'false']),
});
type FormDatos = z.infer<typeof formSchema>;
interface FormularioProps {
  inicial?: Convocatoria;
  onExito: () => void;
  onCancelar: () => void;
}
function FormularioConvocatoria({ inicial, onExito, onCancelar }: FormularioProps) {
  const queryClient = useQueryClient();
  const [subiendoPdf, setSubiendoPdf] = useState(false);
  const form = useForm<FormDatos>({
    resolver: zodResolver(formSchema),
    defaultValues: inicial
      ? {
          titulo: inicial.titulo, numeroRD: inicial.numeroRD,
          descripcion: inicial.descripcion ?? '',
          fase: inicial.fase as FormDatos['fase'],
          fechaInicio: inicial.fechaInicio.slice(0, 10),
          fechaFin: inicial.fechaFin.slice(0, 10),
          pdfMeritosUrl: inicial.pdfMeritosUrl ?? '',
          activo: inicial.activo ? 'true' : 'false',
        }
      : {
          titulo: '', numeroRD: '', descripcion: '',
          fase: 'INSCRIPCION', fechaInicio: '', fechaFin: '', pdfMeritosUrl: '', activo: 'true',
        },
  });
  const guardar = useMutation({
    mutationFn: async (d: FormDatos) => {
      const cuerpo = {
        ...d,
        descripcion: d.descripcion?.trim() ? d.descripcion.trim() : null,
        fechaInicio: new Date(`${d.fechaInicio}T00:00:00`).toISOString(),
        fechaFin: new Date(`${d.fechaFin}T23:59:59`).toISOString(),
        pdfMeritosUrl: d.pdfMeritosUrl?.trim() || null,
        activo: d.activo === 'true',
      };
      const { data } = inicial
        ? await api.put(`/convocatorias/${inicial.id}`, cuerpo)
        : await api.post('/convocatorias', cuerpo);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['convocatorias'] });
      void queryClient.invalidateQueries({ queryKey: ['plazas'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(inicial ? 'Convocatoria actualizada' : 'Convocatoria creada');
      onExito();
    },
    onError: (e) => toast.error(mensajeDeError(e)),
  });
  const c = form.control;
  const enviar = form.handleSubmit((d) => guardar.mutate(d));
  return (
    <form onSubmit={enviar} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <Controller name="titulo" control={c} render={({ field, fieldState }) => (
          <CampoTexto etiqueta="Titulo" valor={field.value} onChange={field.onChange} error={fieldState.error?.message} placeholder="Convocatoria de contrato docente 2025" />
        )} />
      </div>
      <Controller name="numeroRD" control={c} render={({ field, fieldState }) => (
        <CampoTexto etiqueta="Numero de R.D." valor={field.value} onChange={field.onChange} error={fieldState.error?.message} placeholder="R.D. N 00412-2025" />
      )} />
      <Controller name="fase" control={c} render={({ field, fieldState }) => (
        <CampoSelect etiqueta="Fase" valor={field.value} onChange={field.onChange} error={fieldState.error?.message}
          opciones={FASES_CONVOCATORIA.map((f) => ({ valor: f, etiqueta: ETIQUETAS_FASE[f] ?? f }))} />
      )} />
      <Controller name="fechaInicio" control={c} render={({ field, fieldState }) => (
        <CampoTexto etiqueta="Fecha de inicio" tipo="date" valor={field.value} onChange={field.onChange} error={fieldState.error?.message} />
      )} />
      <Controller name="fechaFin" control={c} render={({ field, fieldState }) => (
        <CampoTexto etiqueta="Fecha de fin" tipo="date" valor={field.value} onChange={field.onChange} error={fieldState.error?.message} />
      )} />
      <Controller name="activo" control={c} render={({ field }) => (
        <CampoSelect etiqueta="Estado" valor={field.value} onChange={field.onChange}
          opciones={[{ valor: 'true', etiqueta: 'Activa' }, { valor: 'false', etiqueta: 'Inactiva' }]} />
      )} />
      <div className="md:col-span-2">
        <Controller name="descripcion" control={c} render={({ field, fieldState }) => (
          <CampoArea etiqueta="Descripcion (opcional)" valor={field.value ?? ''} onChange={field.onChange} error={fieldState.error?.message} filas={3} />
        )} />
      </div>
      <div className="md:col-span-2">
        <Controller name="pdfMeritosUrl" control={c} render={({ field, fieldState }) => (
          <div className="space-y-3">
            <CampoTexto
              etiqueta="PDF o enlace de la convocatoria (opcional)"
              tipo="text"
              valor={field.value?.startsWith('data:') ? '' : field.value ?? ''}
              onChange={field.onChange}
              error={fieldState.error?.message}
              ayuda="Pega una URL web o una ruta pública como /documentos/convocatoria.pdf."
              placeholder="/documentos/convocatoria.pdf"
            />
            <CampoCargaArchivo
              etiqueta="Adjuntar bases en PDF"
              tipo="pdf"
              archivos={field.value ? [field.value] : []}
              onChange={(archivos) => field.onChange(archivos[0] ?? '')}
              onSubiendoChange={setSubiendoPdf}
            />
          </div>
        )} />
      </div>
      <div className="md:col-span-2 flex justify-end gap-3 pt-2">
        <Boton variante="secundario" onClick={onCancelar} disabled={guardar.isPending || subiendoPdf}>Cancelar</Boton>
        <Boton type="submit" disabled={guardar.isPending || subiendoPdf}>{guardar.isPending ? 'Guardando...' : inicial ? 'Guardar cambios' : 'Crear convocatoria'}</Boton>
      </div>
    </form>
  );
}
export function ConvocatoriasPage() {
  const { puede } = useAuth();
  const queryClient = useQueryClient();
  const { busqueda, setBusqueda, setPagina, params } = usePaginacion();
  const [busquedaBorrador, setBusquedaBorrador] = useState('');
  const [filtroFase, setFiltroFase] = useState('');
  const [filtroFaseBorrador, setFiltroFaseBorrador] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Convocatoria | undefined>();
  const [eliminando, setEliminando] = useState<Convocatoria | null>(null);
  const [seleccionada, setSeleccionada] = useState<Convocatoria | null>(null);
  const puedeRegistrar = puede('ADMIN_GRED', 'EDITOR_UGEL');
  const puedeAdministrar = puede('ADMIN_GRED');
  const filtrosActivos = [
    ...(busqueda ? [`Búsqueda: ${busqueda}`] : []),
    ...(filtroFase ? [`Fase: ${ETIQUETAS_FASE[filtroFase] ?? filtroFase}`] : []),
  ];
  const consulta = useQuery({
    queryKey: ['convocatorias', params, filtroFase],
    queryFn: async () => {
      const qp = new URLSearchParams({
        page: String(params.page), limit: String(params.limit),
        ...(params.search ? { search: params.search } : {}),
        ...(filtroFase ? { fase: filtroFase } : {}),
      });
      const { data } = await api.get<Pagina<Convocatoria>>(`/convocatorias?${qp}`);
      return data;
    },
  });
  const eliminar = useMutation({
    mutationFn: (id: number) => api.delete(`/convocatorias/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['convocatorias'] });
      void queryClient.invalidateQueries({ queryKey: ['plazas'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Convocatoria eliminada');
      setEliminando(null);
    },
    onError: (e) => toast.error(mensajeDeError(e)),
  });
  const columnas: Columna<Convocatoria>[] = [
    {
      clave: 'titulo', encabezado: 'Convocatoria',
      celda: (c) => (
        <div>
          <button
            type="button"
            onClick={() => setSeleccionada(c)}
            className="text-left font-semibold text-primary hover:underline"
          >
            {c.titulo}
          </button>
          <p className="text-xs text-on-surface-variant">{c.numeroRD}</p>
        </div>
      ),
    },
    {
      clave: 'documento', encabezado: 'Documento',
      celda: (c) => c.pdfMeritosUrl ? (
        <VistaPreviaArchivo url={c.pdfMeritosUrl} titulo={`Convocatoria: ${c.titulo}`} tipo="documento">
          <span className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline">
            <FileText size={15} /> Ver PDF
          </span>
        </VistaPreviaArchivo>
      ) : <span className="text-xs text-on-surface-variant">Sin documento</span>,
    },
    {
      clave: 'fase', encabezado: 'Fase',
      celda: (c) => <Badge tono={TONOS_FASE[c.fase] ?? 'neutro'}>{ETIQUETAS_FASE[c.fase] ?? c.fase}</Badge>,
    },
    {
      clave: 'fechas', encabezado: 'Vigencia',
      celda: (c) => <span className="text-on-surface-variant">{fechaCorta(c.fechaInicio)} - {fechaCorta(c.fechaFin)}</span>,
    },
    {
      clave: 'estado', encabezado: 'Estado',
      celda: (c) => (c.activo ? <Badge tono="exito">Activa</Badge> : <Badge tono="neutro">Inactiva</Badge>),
    },
  ];
  return (
    <div className="space-y-6">
      <EncabezadoPagina
        titulo="Convocatorias"
        icono={Megaphone}
        descripcion="Gestion de convocatorias de vacantes y plazas."
        accion={puedeRegistrar ? { etiqueta: 'Nueva convocatoria', onClick: () => { setEditando(undefined); setModalAbierto(true); } } : undefined}
      />
      <PanelFiltros
        filtrosActivos={filtrosActivos}
        onAplicar={() => {
          setBusqueda(busquedaBorrador);
          setFiltroFase(filtroFaseBorrador);
          setPagina(1);
        }}
        onLimpiar={() => {
          setBusquedaBorrador('');
          setBusqueda('');
          setFiltroFaseBorrador('');
          setFiltroFase('');
          setPagina(1);
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="relative sm:col-span-2">
            <Search size={18} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="search"
              value={busquedaBorrador}
              onChange={(e) => setBusquedaBorrador(e.target.value)}
              placeholder="Buscar por título o R.D...."
              className="h-12 w-full rounded-lg border-[1.5px] border-outline-variant bg-white pl-10 pr-4 outline-none placeholder:text-on-surface-variant/60 focus:border-primary-container"
            />
          </div>
          <select
            aria-label="Filtrar por fase"
            value={filtroFaseBorrador}
            onChange={(e) => setFiltroFaseBorrador(e.target.value)}
            className="h-12 rounded-lg border-[1.5px] border-outline-variant bg-white px-3.5"
          >
            <option value="">Todas las fases</option>
            {FASES_CONVOCATORIA.map((f) => (
              <option key={f} value={f}>{ETIQUETAS_FASE[f] ?? f}</option>
            ))}
          </select>
        </div>
      </PanelFiltros>
      <div className="bg-white rounded-xl border border-outline-variant">
        {consulta.isError ? (
          <p className="p-10 text-center text-error">Error al cargar: {mensajeDeError(consulta.error)}</p>
        ) : (
          <>
            <Tabla
              columnas={columnas} filas={consulta.data?.data ?? []} claveFila={(c) => c.id}
              cargando={consulta.isLoading} vacio="No hay convocatorias registradas."
              acciones={puedeAdministrar ? (c) => (
                <div className="flex justify-end gap-2">
                  <Boton variante="secundario" tamano="sm" onClick={() => { setEditando(c); setModalAbierto(true); }}>Editar</Boton>
                  <Boton variante="secundario" tamano="sm" onClick={() => setEliminando(c)}>Eliminar</Boton>
                </div>
              ) : undefined}
            />
            {consulta.data && (
              <Paginacion pagina={consulta.data.meta.page} totalPaginas={consulta.data.meta.totalPages}
                total={consulta.data.meta.total} onPagina={setPagina} cargando={consulta.isFetching} />
            )}
          </>
        )}
      </div>
      <Modal abierto={modalAbierto} onCerrar={() => setModalAbierto(false)} titulo={editando ? 'Editar convocatoria' : 'Nueva convocatoria'}>
        <FormularioConvocatoria key={editando?.id ?? 'nueva'} inicial={editando}
          onExito={() => setModalAbierto(false)} onCancelar={() => setModalAbierto(false)} />
      </Modal>
      <Modal
        abierto={seleccionada !== null}
        onCerrar={() => setSeleccionada(null)}
        titulo="Detalle de convocatoria"
      >
        {seleccionada && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-on-surface">{seleccionada.titulo}</h3>
              <p className="mt-1 text-sm text-on-surface-variant">
                Resolución: {seleccionada.numeroRD}
              </p>
            </div>
            <div className="grid gap-3 rounded-lg bg-surface-container-low p-4 text-sm sm:grid-cols-2">
              <p><span className="font-semibold">Fase:</span> {ETIQUETAS_FASE[seleccionada.fase] ?? seleccionada.fase}</p>
              <p><span className="font-semibold">Estado:</span> {seleccionada.activo ? 'Activa' : 'Inactiva'}</p>
              <p><span className="font-semibold">Inicio:</span> {fechaCorta(seleccionada.fechaInicio)}</p>
              <p><span className="font-semibold">Fin:</span> {fechaCorta(seleccionada.fechaFin)}</p>
            </div>
            {seleccionada.descripcion && (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-on-surface-variant">
                {seleccionada.descripcion}
              </p>
            )}
            {seleccionada.pdfMeritosUrl ? (
              <VistaPreviaArchivo
                url={seleccionada.pdfMeritosUrl}
                titulo={`Convocatoria: ${seleccionada.titulo}`}
                tipo="documento"
              >
                <span className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary-container px-4 py-2 text-sm font-semibold text-on-primary hover:bg-primary">
                  <FileText size={17} /> Ver documento de la convocatoria
                </span>
              </VistaPreviaArchivo>
            ) : (
              <p className="rounded-lg border border-outline-variant p-3 text-sm text-on-surface-variant">
                Esta convocatoria aún no tiene un PDF o enlace asociado.
              </p>
            )}
          </div>
        )}
      </Modal>
      <Confirmacion abierto={eliminando !== null} onCancelar={() => setEliminando(null)}
        onConfirmar={() => eliminando && eliminar.mutate(eliminando.id)} cargando={eliminar.isPending}
        titulo="Eliminar convocatoria"
        mensaje={eliminando ? `Eliminar ${eliminando.titulo}? Si tiene plazas asociadas solo se desactivara.` : ''} />
    </div>
  );
}

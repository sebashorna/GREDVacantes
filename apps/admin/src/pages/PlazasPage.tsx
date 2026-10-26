import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, ChevronRight, FileText, GraduationCap, MapPin, Pencil, Search, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

import {
  ESTADOS_PLAZA,
  ETIQUETAS_ESTADO_PLAZA,
  ETIQUETAS_JORNADA,
  ETIQUETAS_NIVEL,
  ETIQUETAS_TIPO_PLAZA,
  ETIQUETAS_TURNO,
  ETIQUETAS_ZONA,
  JORNADAS,
  NIVELES,
  TIPOS_PLAZA,
  TURNOS,
  ZONAS,
} from "@shared";
import { api } from "@/lib/api";
import type { Pagina, Plaza } from "@/lib/tipos";
import { mensajeDeError, useAuth } from "@/features/auth/auth-context";
import { usePaginacion } from "@/hooks/usePaginacion";
import {
  useConvocatoriasActivas,
  useInstitucionesOpciones,
  useUgeles,
  type ConvocatoriaOpcion,
} from "@/hooks/useCatalogos";
import { EncabezadoPagina } from "@/components/EncabezadoPagina";
import { Badge, type TonoBadge } from "@/components/ui/Badge";
import { Boton } from "@/components/ui/Boton";
import { Modal } from "@/components/ui/Modal";
import { VistaPreviaArchivo } from "@/components/ui/VistaPreviaArchivo";
import { Paginacion } from "@/components/ui/Paginacion";
import { Confirmacion } from "@/components/ui/Confirmacion";
import { PanelFiltros } from "@/components/ui/PanelFiltros";
const TONOS_ESTADO: Record<string, TonoBadge> = {
  ACTIVA: "exito",
  CONVOCADA: "info",
  ADJUDICADA: "advertencia",
  CERRADA: "neutro",
};

function nombreEtiqueta(t: Record<string, string>, v: string) { return t[v] ?? v; }

interface FormPlaza {
  ieId: string;
  convocatoriaId: string;
  cargo: string;
  area: string;
  nivel: (typeof NIVELES)[number];
  jornada: (typeof JORNADAS)[number];
  zona: (typeof ZONAS)[number];
  turno: (typeof TURNOS)[number];
  tipo: (typeof TIPOS_PLAZA)[number];
  cantidad: string;
  estado: (typeof ESTADOS_PLAZA)[number];
}

function FormularioPlaza({
  inicial,
  onExito,
  onCancelar,
}: {
  inicial?: Plaza;
  onExito: () => void;
  onCancelar: () => void;
}) {
  const queryClient = useQueryClient();
  const instituciones = useInstitucionesOpciones(inicial?.ie?.codigoModular ?? "");
  const convocatoriasQuery = useConvocatoriasActivas();
  const convocatorias = convocatoriasQuery.data;
  const opcionesConvocatorias: ConvocatoriaOpcion[] = [...(convocatorias?.data ?? [])];
  if (
    inicial?.convocatoria
    && !opcionesConvocatorias.some((convocatoria) => convocatoria.id === inicial.convocatoriaId)
  ) {
    opcionesConvocatorias.push({
      id: inicial.convocatoria.id,
      titulo: inicial.convocatoria.titulo,
      numeroRD: inicial.convocatoria.numeroRD,
      fase: inicial.convocatoria.fase,
      activo: false,
    });
  }
  const [datos, setDatos] = useState<FormPlaza>({
    ieId: inicial ? String(inicial.ieId) : "",
    convocatoriaId: inicial?.convocatoriaId ? String(inicial.convocatoriaId) : "",
    cargo: inicial?.cargo ?? "",
    area: inicial?.area ?? "",
    nivel: (inicial?.nivel as FormPlaza["nivel"]) ?? "PRIMARIA",
    jornada: (inicial?.jornada as FormPlaza["jornada"]) ?? "JORNADA_30",
    zona: (inicial?.zona as FormPlaza["zona"]) ?? "URBANA",
    turno: (inicial?.turno as FormPlaza["turno"]) ?? "MANANA",
    tipo: (inicial?.tipo as FormPlaza["tipo"]) ?? "ORGANICA",
    cantidad: inicial ? String(inicial.cantidad) : "1",
    estado: (inicial?.estado as FormPlaza["estado"]) ?? "ACTIVA",
  });
  const guardar = useMutation({
    mutationFn: async (payload: Omit<FormPlaza, "cantidad"> & { cantidad: number }) => {
      if (inicial) {
        return api.put(`/plazas/${inicial.id}`, {
          ...payload,
          ieId: Number(payload.ieId),
          convocatoriaId: Number(payload.convocatoriaId),
        });
      }
      return api.post("/plazas", {
        ...payload,
        ieId: Number(payload.ieId),
        convocatoriaId: Number(payload.convocatoriaId),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["plazas"] });
      void queryClient.invalidateQueries({ queryKey: ["convocatorias"] });
      void queryClient.invalidateQueries({ queryKey: ["instituciones"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(inicial ? "Plaza actualizada" : "Plaza creada");
      onExito();
    },
    onError: (error) => toast.error(mensajeDeError(error)),
  });
  const actualizar = <K extends keyof FormPlaza>(campo: K, valor: FormPlaza[K]) => {
    setDatos((actual) => ({ ...actual, [campo]: valor }));
  };
  const enviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    guardar.mutate({ ...datos, cantidad: Number(datos.cantidad) });
  };
  const selector = "h-12 w-full rounded-lg border border-outline-variant bg-white px-3 text-sm";
  const campo = "h-12 w-full rounded-lg border border-outline-variant bg-white px-3 text-sm";

  return (
    <form onSubmit={enviar} className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <label className="space-y-1 text-sm font-medium text-on-surface">
        Institución educativa
        <select className={selector} required value={datos.ieId} onChange={(evento) => actualizar("ieId", evento.target.value)}>
          <option value="">Seleccione una institución</option>
          {instituciones.data?.data.map((institucion) => (
            <option key={institucion.id} value={institucion.id}>{institucion.nombre} ({institucion.codigoModular})</option>
          ))}
        </select>
      </label>
      <label className="space-y-1 text-sm font-medium text-on-surface">
        Convocatoria
        <select className={selector} required value={datos.convocatoriaId} onChange={(evento) => actualizar("convocatoriaId", evento.target.value)}>
          <option value="">Seleccione una convocatoria</option>
          {opcionesConvocatorias.map((convocatoria) => (
            <option key={convocatoria.id} value={convocatoria.id}>{convocatoria.titulo} · {convocatoria.numeroRD}</option>
          ))}
        </select>
      </label>
      <label className="space-y-1 text-sm font-medium text-on-surface">
        Cargo
        <input className={campo} required minLength={3} maxLength={150} value={datos.cargo} onChange={(evento) => actualizar("cargo", evento.target.value)} />
      </label>
      <label className="space-y-1 text-sm font-medium text-on-surface">
        Área
        <input className={campo} required minLength={2} maxLength={150} value={datos.area} onChange={(evento) => actualizar("area", evento.target.value)} />
      </label>
      <label className="space-y-1 text-sm font-medium text-on-surface">
        Nivel
        <select className={selector} value={datos.nivel} onChange={(evento) => actualizar("nivel", evento.target.value as FormPlaza["nivel"])}>
          {NIVELES.map((valor) => <option key={valor} value={valor}>{ETIQUETAS_NIVEL[valor]}</option>)}
        </select>
      </label>
      <label className="space-y-1 text-sm font-medium text-on-surface">
        Jornada
        <select className={selector} value={datos.jornada} onChange={(evento) => actualizar("jornada", evento.target.value as FormPlaza["jornada"])}>
          {JORNADAS.map((valor) => <option key={valor} value={valor}>{ETIQUETAS_JORNADA[valor]}</option>)}
        </select>
      </label>
      <label className="space-y-1 text-sm font-medium text-on-surface">
        Zona
        <select className={selector} value={datos.zona} onChange={(evento) => actualizar("zona", evento.target.value as FormPlaza["zona"])}>
          {ZONAS.map((valor) => <option key={valor} value={valor}>{ETIQUETAS_ZONA[valor]}</option>)}
        </select>
      </label>
      <label className="space-y-1 text-sm font-medium text-on-surface">
        Turno
        <select className={selector} value={datos.turno} onChange={(evento) => actualizar("turno", evento.target.value as FormPlaza["turno"])}>
          {TURNOS.map((valor) => <option key={valor} value={valor}>{ETIQUETAS_TURNO[valor]}</option>)}
        </select>
      </label>
      <label className="space-y-1 text-sm font-medium text-on-surface">
        Tipo de plaza
        <select className={selector} value={datos.tipo} onChange={(evento) => actualizar("tipo", evento.target.value as FormPlaza["tipo"])}>
          {TIPOS_PLAZA.map((valor) => <option key={valor} value={valor}>{ETIQUETAS_TIPO_PLAZA[valor]}</option>)}
        </select>
      </label>
      <label className="space-y-1 text-sm font-medium text-on-surface">
        Cantidad
        <input className={campo} type="number" required min={1} max={500} value={datos.cantidad} onChange={(evento) => actualizar("cantidad", evento.target.value)} />
      </label>
      <label className="space-y-1 text-sm font-medium text-on-surface">
        Estado
        <select className={selector} value={datos.estado} onChange={(evento) => actualizar("estado", evento.target.value as FormPlaza["estado"])}>
          {ESTADOS_PLAZA.map((valor) => <option key={valor} value={valor}>{ETIQUETAS_ESTADO_PLAZA[valor]}</option>)}
        </select>
      </label>
      {(instituciones.isLoading || convocatoriasQuery.isLoading) && (
        <p className="md:col-span-2 text-sm text-on-surface-variant">Cargando opciones de institución y convocatoria...</p>
      )}
      {(instituciones.isError || convocatoriasQuery.isError) && (
        <p role="alert" className="md:col-span-2 text-sm text-error">
          No se pudieron cargar las opciones para el formulario.{' '}
          {instituciones.isError && <button type="button" onClick={() => void instituciones.refetch()} className="font-semibold underline">
            Reintentar instituciones
          </button>}
          {convocatoriasQuery.isError && (
            <button type="button" onClick={() => void convocatoriasQuery.refetch()} className="ml-3 font-semibold underline">
              Reintentar convocatorias
            </button>
          )}
        </p>
      )}
      <div className="md:col-span-2 flex justify-end gap-2">
        <Boton variante="secundario" onClick={onCancelar} disabled={guardar.isPending}>Cancelar</Boton>
        <Boton type="submit" disabled={guardar.isPending || instituciones.isError || convocatoriasQuery.isError || !instituciones.data || !convocatorias}>
          {guardar.isPending ? "Guardando..." : inicial ? "Guardar cambios" : "Registrar plaza"}
        </Boton>
      </div>
    </form>
  );
}

export function PlazasPage() {
  const { puede } = useAuth();
  const queryClient = useQueryClient();
  const { busqueda, setBusqueda, setPagina, params } = usePaginacion();
  const [busquedaBorrador, setBusquedaBorrador] = useState("");
  const [fTipo, setFTipo] = useState("");
  const [fTipoBorrador, setFTipoBorrador] = useState("");
  const [fNivel, setFNivel] = useState("");
  const [fNivelBorrador, setFNivelBorrador] = useState("");
  const [fEstado, setFEstado] = useState("");
  const [fEstadoBorrador, setFEstadoBorrador] = useState("");
  const [fUgel, setFUgel] = useState("");
  const [fUgelBorrador, setFUgelBorrador] = useState("");
  const [modal, setModal] = useState(false);
  const [plazaEditando, setPlazaEditando] = useState<Plaza | null>(null);
  const [plazaEliminando, setPlazaEliminando] = useState<Plaza | null>(null);
  const [plazaRequisitos, setPlazaRequisitos] = useState<Plaza | null>(null);
  const puedeRegistrar = puede("ADMIN_GRED", "EDITOR_UGEL");
  const puedeAdministrar = puede("ADMIN_GRED");
  const { data: ugeles } = useUgeles();
  const filtrosActivos = [
    ...(busqueda ? [`Búsqueda: ${busqueda}`] : []),
    ...(fTipo ? [`Tipo: ${ETIQUETAS_TIPO_PLAZA[fTipo as keyof typeof ETIQUETAS_TIPO_PLAZA]}`] : []),
    ...(fNivel ? [`Nivel: ${ETIQUETAS_NIVEL[fNivel as keyof typeof ETIQUETAS_NIVEL]}`] : []),
    ...(fEstado ? [`Estado: ${ETIQUETAS_ESTADO_PLAZA[fEstado as keyof typeof ETIQUETAS_ESTADO_PLAZA]}`] : []),
    ...(fUgel ? [`UGEL: ${ugeles?.find((ugel) => String(ugel.id) === fUgel)?.nombre ?? fUgel}`] : []),
  ];
  const eliminar = useMutation({
    mutationFn: (id: number) => api.delete(`/plazas/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["plazas"] });
      void queryClient.invalidateQueries({ queryKey: ["convocatorias"] });
      void queryClient.invalidateQueries({ queryKey: ["instituciones"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Plaza eliminada");
      setPlazaEliminando(null);
    },
    onError: (error) => toast.error(mensajeDeError(error)),
  });

  const q = useQuery({ queryKey: ["plazas", params, fTipo, fNivel, fEstado, fUgel], queryFn: async () => {
    const kp = new URLSearchParams({ page: String(params.page), limit: String(params.limit), ...(params.search ? { search: params.search } : {}), ...(fTipo ? { tipo: fTipo } : {}), ...(fNivel ? { nivel: fNivel } : {}), ...(fEstado ? { estado: fEstado } : {}), ...(fUgel ? { ugelId: fUgel } : {}) });
    const { data } = await api.get<Pagina<Plaza>>(`/plazas?${kp}`);
    return data;
  } });

  const sel = "h-12 px-3.5 rounded-lg border-[1.5px] border-outline-variant bg-white cursor-pointer";
  const convocatoriaDestacada = q.data?.data.find((plaza) => plaza.convocatoria)?.convocatoria;

  return (
    <div className="space-y-6">
      <EncabezadoPagina
        titulo="Plazas disponibles"
        descripcion="Convocatorias y plazas docentes por institución educativa."
        accion={puedeRegistrar ? { etiqueta: "Nueva plaza", onClick: () => { setPlazaEditando(null); setModal(true); } } : undefined}
        extra={
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm font-medium text-on-surface-variant">
            <GraduationCap size={17} className="text-primary" />
            GRED Lambayeque
          </span>
        }
      />

      <PanelFiltros
        filtrosActivos={filtrosActivos}
        onAplicar={() => {
          setBusqueda(busquedaBorrador);
          setFTipo(fTipoBorrador);
          setFNivel(fNivelBorrador);
          setFEstado(fEstadoBorrador);
          setFUgel(fUgelBorrador);
          setPagina(1);
        }}
        onLimpiar={() => {
          setBusquedaBorrador("");
          setBusqueda("");
          setFTipoBorrador("");
          setFTipo("");
          setFNivelBorrador("");
          setFNivel("");
          setFEstadoBorrador("");
          setFEstado("");
          setFUgelBorrador("");
          setFUgel("");
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
              placeholder="Buscar por I.E., cargo o especialidad..."
              className="h-12 w-full rounded-lg border-[1.5px] border-outline-variant bg-white pl-10 pr-10 outline-none placeholder:text-on-surface-variant/60 focus:border-primary-container"
            />
          </div>
          <select aria-label="Filtrar por tipo de plaza" value={fTipoBorrador} onChange={(e) => setFTipoBorrador(e.target.value)} className={sel}>
            <option value="">Todos los tipos</option>
            {TIPOS_PLAZA.map((tipo) => <option key={tipo} value={tipo}>{ETIQUETAS_TIPO_PLAZA[tipo]}</option>)}
          </select>
          <select aria-label="Filtrar por estado" value={fEstadoBorrador} onChange={(e) => setFEstadoBorrador(e.target.value)} className={sel}>
            <option value="">Todos los estados</option>
            {ESTADOS_PLAZA.map((estado) => <option key={estado} value={estado}>{ETIQUETAS_ESTADO_PLAZA[estado]}</option>)}
          </select>
          <select aria-label="Filtrar por nivel educativo" value={fNivelBorrador} onChange={(e) => setFNivelBorrador(e.target.value)} className={sel}>
            <option value="">Todos los niveles</option>
            {NIVELES.map((nivel) => <option key={nivel} value={nivel}>{ETIQUETAS_NIVEL[nivel]}</option>)}
          </select>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <button
              type="button"
              aria-pressed={!fUgelBorrador}
              onClick={() => setFUgelBorrador("")}
              className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition ${
                !fUgelBorrador
                  ? "border-primary-container bg-primary-container text-on-primary"
                  : "border-outline-variant bg-white text-on-surface-variant hover:bg-surface-container-low"
              }`}
            >
              {!fUgelBorrador && <Check size={15} className="mr-1 inline" />}
              Todas las UGEL
            </button>
            {(ugeles ?? []).map((ugel) => {
              const activa = fUgelBorrador === String(ugel.id);
              return (
                <button
                  key={ugel.id}
                  type="button"
                  aria-pressed={activa}
                  onClick={() => setFUgelBorrador(activa ? "" : String(ugel.id))}
                  className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition ${
                    activa
                      ? "border-primary-container bg-primary-container text-on-primary"
                      : "border-outline-variant bg-white text-on-surface-variant hover:bg-surface-container-low"
                  }`}
                >
                  {ugel.nombre}
                </button>
              );
            })}
          </div>
        </div>
      </PanelFiltros>
      <p className="text-right text-sm font-semibold text-primary">
        {q.isLoading ? "Cargando..." : `${q.data?.meta.total ?? 0} plazas encontradas`}
      </p>

      <section className="space-y-3" aria-label="Listado de plazas docentes">
        {q.isError ? (
          <p role="alert" className="rounded-xl border border-error/30 bg-error-container p-5 text-center text-sm text-on-error-container">
            Error al cargar las plazas: {mensajeDeError(q.error)}
          </p>
        ) : q.isLoading ? (
          <p className="rounded-xl border border-outline-variant bg-white p-8 text-center text-sm text-on-surface-variant">
            Cargando plazas...
          </p>
        ) : (q.data?.data.length ?? 0) === 0 ? (
          <p className="rounded-xl border border-outline-variant bg-white p-8 text-center text-sm text-on-surface-variant">
            No hay plazas que coincidan con los filtros.
          </p>
        ) : (
          <>
            {q.data?.data.map((plaza) => (
              <article key={plaza.id} className="rounded-xl border border-outline-variant bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tono={plaza.tipo === "ORGANICA" ? "exito" : plaza.tipo === "EVENTUAL_CUADRO" ? "advertencia" : "info"}>
                        {nombreEtiqueta(ETIQUETAS_TIPO_PLAZA, plaza.tipo)}
                      </Badge>
                      {plaza.ie?.ugel?.nombre && <Badge tono="neutro">{plaza.ie.ugel.nombre}</Badge>}
                    </div>
                    <h2 className="mt-2 text-base font-semibold leading-snug text-on-surface">
                      {plaza.ie?.nombre ?? `I.E. #${plaza.ieId}`}
                    </h2>
                    <p className="mt-0.5 text-sm font-semibold text-primary">
                      {plaza.cargo}{plaza.area ? ` · ${plaza.area}` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 rounded-lg border border-outline-variant/60 bg-surface-container-low px-2.5 py-1.5 text-right">
                    <span className="block text-[10px] font-bold uppercase leading-none text-outline">Cód. modular</span>
                    <span className="mt-1 block text-sm font-bold tracking-wide text-on-surface">
                      {plaza.ie?.codigoModular ?? "—"}
                    </span>
                  </div>
                </div>

                <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1 border-t border-outline-variant/60 pt-3 text-sm text-on-surface-variant sm:grid-cols-2">
                  <div>
                    <dt className="inline font-semibold text-on-surface">Nivel: </dt>
                    <dd className="inline">{nombreEtiqueta(ETIQUETAS_NIVEL, plaza.nivel)}</dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold text-on-surface">Jornada: </dt>
                    <dd className="inline">{nombreEtiqueta(ETIQUETAS_JORNADA, plaza.jornada)}</dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold text-on-surface">Zona: </dt>
                    <dd className="inline">{nombreEtiqueta(ETIQUETAS_ZONA, plaza.zona)}</dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold text-on-surface">Turno: </dt>
                    <dd className="inline">{nombreEtiqueta(ETIQUETAS_TURNO, plaza.turno)}</dd>
                  </div>
                  {(plaza.ie?.provincia?.nombre || plaza.ie?.distrito?.nombre) && (
                    <div className="flex items-center gap-1 sm:col-span-2">
                      <MapPin size={15} className="shrink-0 text-primary" />
                      <dd>
                        {plaza.ie?.provincia?.nombre && <>Provincia: <span className="font-semibold text-on-surface">{plaza.ie.provincia.nombre}</span></>}
                        {plaza.ie?.provincia?.nombre && plaza.ie?.distrito?.nombre && " · "}
                        {plaza.ie?.distrito?.nombre && <>Distrito: <span className="font-semibold text-on-surface">{plaza.ie.distrito.nombre}</span></>}
                      </dd>
                    </div>
                  )}
                </dl>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/60 pt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tono={TONOS_ESTADO[plaza.estado] ?? "neutro"}>
                      {nombreEtiqueta(ETIQUETAS_ESTADO_PLAZA, plaza.estado)}
                    </Badge>
                    {plaza.convocatoria?.numeroRD && (
                      <span className="text-xs text-on-surface-variant">R.D. {plaza.convocatoria.numeroRD}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-right">
                    <span className="text-3xl font-extrabold leading-none text-primary-container">{plaza.cantidad}</span>
                    <span className="text-xs font-bold text-secondary">{plaza.cantidad === 1 ? "plaza" : "plazas"}</span>
                  </div>
                </div>
                <div className="mt-3 flex justify-end border-t border-outline-variant/60 pt-3">
                  <button
                    type="button"
                    onClick={() => setPlazaRequisitos(plaza)}
                    className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary-container px-3.5 text-sm font-semibold text-on-primary transition hover:bg-primary"
                  >
                    Ver requisitos <ChevronRight size={17} />
                  </button>
                </div>
                {puedeAdministrar && (
                  <div className="mt-3 flex justify-end gap-2 border-t border-outline-variant/60 pt-3">
                    <Boton variante="secundario" tamano="sm" onClick={() => { setPlazaEditando(plaza); setModal(true); }}>
                      <Pencil size={14} /> Editar
                    </Boton>
                    <Boton variante="secundario" tamano="sm" onClick={() => setPlazaEliminando(plaza)}>
                      <Trash2 size={14} /> Eliminar
                    </Boton>
                  </div>
                )}
              </article>
            ))}
            {q.data && (
              <Paginacion
                pagina={q.data.meta.page}
                totalPaginas={q.data.meta.totalPages}
                total={q.data.meta.total}
                onPagina={setPagina}
                cargando={q.isFetching}
              />
            )}
          </>
        )}
      </section>

      {convocatoriaDestacada && (
        <aside className="flex items-start gap-4 rounded-xl border border-outline-variant bg-white p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-primary">
            <GraduationCap size={21} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-wide text-primary">Información de convocatoria</p>
              <Badge tono="info">{nombreEtiqueta({ INSCRIPCION: "Inscripción", ADJUDICACION: "Adjudicación", CONTRATACION: "Contratación", FINALIZADA: "Finalizada" }, convocatoriaDestacada.fase)}</Badge>
            </div>
            <h2 className="mt-1 font-semibold text-on-surface">{convocatoriaDestacada.titulo}</h2>
            <p className="mt-1 text-sm text-on-surface-variant">R.D. {convocatoriaDestacada.numeroRD}</p>
          </div>
        </aside>
      )}
      <Modal
        abierto={modal}
        onCerrar={() => setModal(false)}
        titulo={plazaEditando ? "Editar plaza" : "Nueva plaza"}
      >
        <FormularioPlaza
          key={plazaEditando?.id ?? "nueva"}
          inicial={plazaEditando ?? undefined}
          onExito={() => setModal(false)}
          onCancelar={() => setModal(false)}
        />
      </Modal>
      <Confirmacion
        abierto={plazaEliminando !== null}
        onCancelar={() => setPlazaEliminando(null)}
        onConfirmar={() => { if (plazaEliminando) eliminar.mutate(plazaEliminando.id); }}
        cargando={eliminar.isPending}
        titulo="Eliminar plaza"
        mensaje={plazaEliminando ? `¿Eliminar la plaza de ${plazaEliminando.cargo} en ${plazaEliminando.ie?.nombre ?? "esta institución"}? Esta acción no se puede deshacer.` : ""}
      />
      <Modal
        abierto={plazaRequisitos !== null}
        onCerrar={() => setPlazaRequisitos(null)}
        titulo="Bases y requisitos de la plaza"
      >
        {plazaRequisitos && (
          <div className="space-y-4">
            <div>
              <h2 className="font-semibold text-on-surface">{plazaRequisitos.cargo}</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                {plazaRequisitos.area} · {plazaRequisitos.ie?.nombre ?? `Institución #${plazaRequisitos.ieId}`}
              </p>
            </div>
            {plazaRequisitos.convocatoria ? (
              <>
                <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-primary">Convocatoria</p>
                  <h3 className="mt-1 font-semibold text-on-surface">{plazaRequisitos.convocatoria.titulo}</h3>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    Resolución: {plazaRequisitos.convocatoria.numeroRD}
                  </p>
                  {plazaRequisitos.convocatoria.descripcion && (
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-on-surface-variant">
                      {plazaRequisitos.convocatoria.descripcion}
                    </p>
                  )}
                  {plazaRequisitos.convocatoria.fechaInicio && plazaRequisitos.convocatoria.fechaFin && (
                    <p className="mt-3 text-xs text-on-surface-variant">
                      Periodo: {new Date(plazaRequisitos.convocatoria.fechaInicio).toLocaleDateString("es-PE")} – {new Date(plazaRequisitos.convocatoria.fechaFin).toLocaleDateString("es-PE")}
                    </p>
                  )}
                </div>
                {plazaRequisitos.convocatoria.pdfMeritosUrl ? (
                  <VistaPreviaArchivo
                    url={plazaRequisitos.convocatoria.pdfMeritosUrl}
                    titulo="Bases y requisitos oficiales"
                    tipo="documento"
                  >
                    <span className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary-container px-4 py-2 text-sm font-semibold text-on-primary hover:bg-primary">
                      <FileText size={17} /> Ver bases y requisitos oficiales
                    </span>
                  </VistaPreviaArchivo>
                ) : (
                  <p className="rounded-lg border border-secondary-fixed bg-secondary-fixed/40 p-3 text-sm text-on-surface-variant">
                    Esta convocatoria todavía no tiene un documento oficial de bases registrado. Consulta los requisitos en la convocatoria o en la resolución indicada.
                  </p>
                )}
              </>
            ) : (
              <p className="rounded-lg border border-secondary-fixed bg-secondary-fixed/40 p-3 text-sm text-on-surface-variant">
                Esta plaza no tiene una convocatoria asociada con requisitos publicados.
              </p>
            )}
            <Link
              to="/convocatorias"
              onClick={() => setPlazaRequisitos(null)}
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              Consultar convocatorias <ChevronRight size={16} />
            </Link>
            <div className="flex justify-end border-t border-outline-variant pt-3">
              <Boton variante="secundario" onClick={() => setPlazaRequisitos(null)}>Cerrar</Boton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

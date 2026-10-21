import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, GraduationCap, MapPin, Search, X } from "lucide-react";

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
import { useUgeles } from "@/hooks/useCatalogos";
import { EncabezadoPagina } from "@/components/EncabezadoPagina";
import { Badge, type TonoBadge } from "@/components/ui/Badge";
import { Boton } from "@/components/ui/Boton";
import { CampoSelect, CampoTexto } from "@/components/ui/Campo";
import { Confirmacion } from "@/components/ui/Confirmacion";
import { Modal } from "@/components/ui/Modal";
import { Paginacion } from "@/components/ui/Paginacion";
const TONOS_ESTADO: Record<string, TonoBadge> = {
  ACTIVA: "exito",
  CONVOCADA: "info",
  ADJUDICADA: "advertencia",
  CERRADA: "neutro",
};

function nombreEtiqueta(t: Record<string, string>, v: string) { return t[v] ?? v; }

export function PlazasPage() {
  const { puede } = useAuth();
  const queryClient = useQueryClient();
  const { busqueda, setBusqueda, setPagina, params } = usePaginacion();
  const [fTipo, setFTipo] = useState("");
  const [fNivel, setFNivel] = useState("");
  const [fEstado, setFEstado] = useState("");
  const [fUgel, setFUgel] = useState("");
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<Plaza | undefined>();
  const [elim, setEliminando] = useState<Plaza | null>(null);
  const puedeEscribir = puede("ADMIN_GRED", "EDITOR_UGEL");
  const { data: ugeles } = useUgeles();

  const q = useQuery({ queryKey: ["plazas", params, fTipo, fNivel, fEstado, fUgel], queryFn: async () => {
    const kp = new URLSearchParams({ page: String(params.page), limit: String(params.limit), ...(params.search ? { search: params.search } : {}), ...(fTipo ? { tipo: fTipo } : {}), ...(fNivel ? { nivel: fNivel } : {}), ...(fEstado ? { estado: fEstado } : {}), ...(fUgel ? { ugelId: fUgel } : {}) });
    const { data } = await api.get<Pagina<Plaza>>(`/plazas?${kp}`);
    return data;
  } });

  const borrar = useMutation({ mutationFn: (id: number) => api.delete(`/plazas/${id}`), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["plazas"] }); toast.success("Plaza eliminada"); setEliminando(null); }, onError: (e) => toast.error(mensajeDeError(e)) });

  const sel = "h-12 px-3.5 rounded-lg border-[1.5px] border-outline-variant bg-white cursor-pointer";
  const convocatoriaDestacada = q.data?.data.find((plaza) => plaza.convocatoria)?.convocatoria;

  return (
    <div className="space-y-6">
      <EncabezadoPagina
        titulo="Plazas disponibles"
        descripcion="Convocatorias y plazas docentes por institución educativa."
        accion={puedeEscribir ? { etiqueta: "Nueva plaza", onClick: () => { setEditando(undefined); setModal(true); } } : undefined}
        extra={
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm font-medium text-on-surface-variant">
            <GraduationCap size={17} className="text-primary" />
            GRED Lambayeque
          </span>
        }
      />

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:max-w-sm">
            <Search size={18} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por I.E., cargo o especialidad..."
              className="h-12 w-full rounded-lg border-[1.5px] border-outline-variant bg-white pl-10 pr-10 outline-none placeholder:text-on-surface-variant/60 focus:border-primary-container"
            />
            {busqueda && (
              <button
                type="button"
                aria-label="Limpiar búsqueda"
                onClick={() => setBusqueda("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
              >
                <X size={17} />
              </button>
            )}
          </div>
          <select
            aria-label="Filtrar por tipo de plaza"
            value={fTipo}
            onChange={(e) => { setFTipo(e.target.value); setPagina(1); }}
            className={sel}
          >
            <option value="">Todos los tipos</option>
            {TIPOS_PLAZA.map((tipo) => (
              <option key={tipo} value={tipo}>{ETIQUETAS_TIPO_PLAZA[tipo]}</option>
            ))}
          </select>
          <select
            aria-label="Filtrar por estado"
            value={fEstado}
            onChange={(e) => { setFEstado(e.target.value); setPagina(1); }}
            className={sel}
          >
            <option value="">Todos los estados</option>
            {ESTADOS_PLAZA.map((estado) => (
              <option key={estado} value={estado}>{ETIQUETAS_ESTADO_PLAZA[estado]}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            aria-pressed={!fUgel}
            onClick={() => { setFUgel(""); setPagina(1); }}
            className={`shrink-0 rounded-lg border px-3.5 py-2 text-sm font-medium transition ${
              !fUgel
                ? "border-primary-container bg-primary-container text-on-primary"
                : "border-outline-variant bg-white text-on-surface-variant hover:bg-surface-container-low"
            }`}
          >
            {!fUgel && <Check size={15} className="mr-1 inline" />}
            Todas las UGEL
          </button>
          {(ugeles ?? []).map((ugel) => {
            const activa = fUgel === String(ugel.id);
            return (
              <button
                key={ugel.id}
                type="button"
                aria-pressed={activa}
                onClick={() => { setFUgel(activa ? "" : String(ugel.id)); setPagina(1); }}
                className={`shrink-0 rounded-lg border px-3.5 py-2 text-sm font-medium transition ${
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

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <select
              aria-label="Filtrar por nivel educativo"
              value={fNivel}
              onChange={(e) => { setFNivel(e.target.value); setPagina(1); }}
              className={sel}
            >
              <option value="">Todos los niveles</option>
              {NIVELES.map((nivel) => (
                <option key={nivel} value={nivel}>{ETIQUETAS_NIVEL[nivel]}</option>
              ))}
            </select>
          </div>
          <p className="text-sm font-semibold text-primary">
            {q.isLoading ? "Cargando..." : `${q.data?.meta.total ?? 0} plazas encontradas`}
          </p>
        </div>
      </section>

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
                    {puedeEscribir && (
                      <div className="ml-2 flex gap-2">
                        <Boton variante="secundario" tamano="sm" onClick={() => { setEditando(plaza); setModal(true); }}>
                          Editar
                        </Boton>
                        <Boton variante="secundario" tamano="sm" onClick={() => setEliminando(plaza)}>
                          Eliminar
                        </Boton>
                      </div>
                    )}
                  </div>
                </div>
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
      <Modal abierto={modal} onCerrar={() => setModal(false)} titulo={editando ? "Editar plaza" : "Nueva plaza"}>
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CampoSelect etiqueta="Institucion" valor={editando?.ieId ?? ""} onChange={() => {}} error="" opciones={[ { valor: "1", etiqueta: "IE 1" }, { valor: "2", etiqueta: "IE 2" } ]} />
          <CampoSelect etiqueta="Convocatoria" valor={editando?.convocatoriaId ?? ""} onChange={() => {}} error="" opciones={[ { valor: "1", etiqueta: "Conv 1" }, { valor: "2", etiqueta: "Conv 2" } ]} />
          <CampoTexto etiqueta="Cargo" valor={editando?.cargo ?? ""} onChange={() => {}} error="" placeholder="Docente" />
          <CampoTexto etiqueta="Area" valor={editando?.area ?? ""} onChange={() => {}} error="" placeholder="Matematicas" />
          <CampoSelect etiqueta="Nivel" valor={editando?.nivel ?? "PRIMARIA"} onChange={() => {}} error="" opciones={NIVELES.map((n) => ({ valor: n, etiqueta: ETIQUETAS_NIVEL[n] }))} />
          <CampoSelect etiqueta="Jornada" valor={editando?.jornada ?? "JORNADA_30"} onChange={() => {}} error="" opciones={JORNADAS.map((j) => ({ valor: j, etiqueta: ETIQUETAS_JORNADA[j] }))} />
          <CampoSelect etiqueta="Zona" valor={editando?.zona ?? "URBANA"} onChange={() => {}} error="" opciones={ZONAS.map((z) => ({ valor: z, etiqueta: ETIQUETAS_ZONA[z] }))} />
          <CampoSelect etiqueta="Turno" valor={editando?.turno ?? "MANANA"} onChange={() => {}} error="" opciones={TURNOS.map((t) => ({ valor: t, etiqueta: ETIQUETAS_TURNO[t] }))} />
          <CampoSelect etiqueta="Tipo" valor={editando?.tipo ?? "ORGANICA"} onChange={() => {}} error="" opciones={TIPOS_PLAZA.map((t) => ({ valor: t, etiqueta: ETIQUETAS_TIPO_PLAZA[t] }))} />
          <CampoTexto etiqueta="Cantidad" tipo="number" valor={String(editando?.cantidad ?? 1)} onChange={() => {}} error="" min={1} max={500} />
          <CampoSelect etiqueta="Estado" valor={editando?.estado ?? "ACTIVA"} onChange={() => {}} error="" opciones={ESTADOS_PLAZA.map((e) => ({ valor: e, etiqueta: ETIQUETAS_ESTADO_PLAZA[e] }))} />
          <div className="md:col-span-2 flex justify-end gap-2"><Boton variante="secundario" onClick={() => setModal(false)}>Cancelar</Boton><Boton type="submit">Guardar</Boton></div>
        </form>
      </Modal>
      <Confirmacion abierto={elim !== null} onCancelar={() => setEliminando(null)} onConfirmar={() => elim && borrar.mutate(elim.id)} titulo="Eliminar plaza" mensaje={elim ? `¿Eliminar ${elim.cargo}?` : ""} />
    </div>
  );
}

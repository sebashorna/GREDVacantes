import { useState } from "react";


import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
import { Tabla, type Columna } from "@/components/ui/Tabla";
const TONOS_ESTADO: Record<string, TonoBadge> = { ACTIVA: "exito", CONVOCADA: "info", ADJUDICADA: "advertencia", CERRADA: "neutro" };

const TIPOS_PLAZA = ["CARRERA", "OTRO", "PRACTICA"] as const;
const NIVELES = ["PRIMARIA", "SECUNDARIA", "TECNICO"] as const;
const JORNADAS = ["JORNADA_20", "JORNADA_30", "JORNADA_40"] as const;
const ZONAS = ["URBANA", "RURAL"] as const;
const TURNOS = ["MANANA", "TARDENO", "NOCTURNO"] as const;
const ESTADOS_PLAZA = ["ACTIVA", "RESUELTA", "CERRADA"] as const;

const ETIQUETAS_TIPO_PLAZA = { CARRERA: "Carrera", OTRO: "Otro", PRACTICA: "Practica" } as const;
const ETIQUETAS_NIVEL = { PRIMARIA: "Primaria", SECUNDARIA: "Secundaria", TECNICO: "Técnico" } as const;
const ETIQUETAS_JORNADA = { JORNADA_20: "20h", JORNADA_30: "30h", JORNADA_40: "40h" } as const;
const ETIQUETAS_ZONA = { URBANA: " Urbana", RURAL: " Rural" } as const;
const ETIQUETAS_TURNO = { MANANA: "Manana", TARDENO: "Tarde", NOCTURNO: "Noche" } as const;
const ETIQUETAS_ESTADO_PLAZA = { ACTIVA: "Activa", RESUELTA: "Resuelta", CERRADA: "Cerrada" } as const;

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

  const cols: Columna<Plaza>[] = [
    { clave: "cargo", encabezado: "Cargo / Area", celda: (p) => <><p className="font-semibold">{p.cargo}</p><p className="text-xs">{p.area} · {nombreEtiqueta(ETIQUETAS_NIVEL, p.nivel)}</p></> },
    { clave: "ie", encabezado: "Institucion", celda: (p) => <><p className="text-on-surface">{p.ie?.nombre ?? `IE #${p.ieId}`}</p><p className="text-xs">{p.ie?.ugel?.nombre ?? ""}</p></> },
    { clave: "conv", encabezado: "Convocatoria", celda: (p) => <span className="text-xs">{p.convocatoria?.numeroRD ?? "-"}</span> },
    { clave: "cant", encabezado: "Cant.", celda: (p) => <span className="font-semibold">{p.cantidad}</span>, clase: "text-center" },
    { clave: "tipo", encabezado: "Tipo", celda: (p) => <span className="text-xs">{nombreEtiqueta(ETIQUETAS_TIPO_PLAZA, p.tipo)}</span> },
    { clave: "estado", encabezado: "Estado", celda: (p) => <Badge tono={TONOS_ESTADO[p.estado] ?? "neutro"}>{nombreEtiqueta(ETIQUETAS_ESTADO_PLAZA, p.estado)}</Badge> },
  ];
  const sel = "h-12 px-3.5 rounded-lg border-[1.5px] border-outline-variant bg-white cursor-pointer";

  return (
    <div className="space-y-6">
      <EncabezadoPagina titulo="Plazas" descripcion="Plazas docentes por institucion y convocatoria." accion={puedeEscribir ? { etiqueta: "Nueva plaza", onClick: () => { setEditando(undefined); setModal(true); } } : undefined} />
      <div className="flex flex-wrap gap-3">
        <input type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar..." className="h-12 px-4 rounded-lg border-[1.5px] border-outline-variant bg-white outline-none w-full sm:w-64" />
        <select value={fTipo} onChange={(e) => { setFTipo(e.target.value); setPagina(1); }} className={sel}><option>Todos los tipos</option>{TIPOS_PLAZA.map((t) => <option key={t} value={t}>{ETIQUETAS_TIPO_PLAZA[t]}</option>)}</select>
        <select value={fNivel} onChange={(e) => { setFNivel(e.target.value); setPagina(1); }} className={sel}><option>Todos los niveles</option>{NIVELES.map((n) => <option key={n} value={n}>{ETIQUETAS_NIVEL[n]}</option>)}</select>
        <select value={fEstado} onChange={(e) => { setFEstado(e.target.value); setPagina(1); }} className={sel}><option>Todos los estados</option>{ESTADOS_PLAZA.map((e) => <option key={e} value={e}>{ETIQUETAS_ESTADO_PLAZA[e]}</option>)}</select>
        <select value={fUgel} onChange={(e) => { setFUgel(e.target.value); setPagina(1); }} className={sel}><option>Todas las UGEL</option>{(ugeles ?? []).map((u: any) => <option key={u.id} value={u.id}>{u.nombre}</option>)}</select>
      </div>
      <div className="bg-white rounded-xl border border-outline-variant">
        {q.isError ? <p className="p-10 text-center text-error">Error: {mensajeDeError(q.error)}</p> : (
          <>
            <Tabla columnas={cols} filas={q.data?.data ?? []} claveFila={(p) => p.id} cargando={q.isLoading} vacio="No hay plazas." acciones={puedeEscribir ? (p) => <div className="flex justify-end gap-2"><Boton variante="secundario" tamano="sm" onClick={() => { setEditando(p); setModal(true); }}>Editar</Boton><Boton variante="secundario" tamano="sm" onClick={() => setEliminando(p)}>Eliminar</Boton></div> : undefined} />
            {q.data && <Paginacion pagina={q.data.meta.page} totalPaginas={q.data.meta.totalPages} total={q.data.meta.total} onPagina={setPagina} cargando={q.isFetching} />}
          </>
        )}
      </div>
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
          <CampoSelect etiqueta="Tipo" valor={editando?.tipo ?? "CARRERA"} onChange={() => {}} error="" opciones={TIPOS_PLAZA.map((t) => ({ valor: t, etiqueta: ETIQUETAS_TIPO_PLAZA[t] }))} />
          <CampoTexto etiqueta="Cantidad" tipo="number" valor={String(editando?.cantidad ?? 1)} onChange={() => {}} error="" min={1} max={500} />
          <CampoSelect etiqueta="Estado" valor={editando?.estado ?? "ACTIVA"} onChange={() => {}} error="" opciones={ESTADOS_PLAZA.map((e) => ({ valor: e, etiqueta: ETIQUETAS_ESTADO_PLAZA[e] }))} />
          <div className="md:col-span-2 flex justify-end gap-2"><Boton variante="secundario" onClick={() => setModal(false)}>Cancelar</Boton><Boton type="submit">Guardar</Boton></div>
        </form>
      </Modal>
      <Confirmacion abierto={elim !== null} onCancelar={() => setEliminando(null)} onConfirmar={() => elim && borrar.mutate(elim.id)} titulo="Eliminar plaza" mensaje={elim ? `¿Eliminar ${elim.cargo}?` : ""} />
    </div>
  );
}



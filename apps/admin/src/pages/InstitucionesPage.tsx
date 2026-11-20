import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, School, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  ETIQUETAS_NIVEL, ETIQUETAS_TURNO, ETIQUETAS_ZONA, NIVELES, TURNOS, ZONAS,
  institucionCreateSchema,
} from '@shared';
import { EncabezadoPagina } from '@/components/EncabezadoPagina';
import { Badge } from '@/components/ui/Badge';
import { Boton } from '@/components/ui/Boton';
import { CampoSelect, CampoTexto } from '@/components/ui/Campo';
import { CampoCargaArchivo } from '@/components/ui/CampoCargaArchivo';
import { Confirmacion } from '@/components/ui/Confirmacion';
import { Modal } from '@/components/ui/Modal';
import { Paginacion } from '@/components/ui/Paginacion';
import { useAuth, mensajeDeError } from '@/features/auth/auth-context';
import { useDistritos, useProvincias, useUgeles } from '@/hooks/useCatalogos';
import { api } from '@/lib/api';
import type { Pagina } from '@/lib/tipos';

interface Institucion {
  id: number;
  codigoModular: string;
  nombre: string;
  nivel: string;
  turno: string;
  zona: string;
  ugelId: number;
  provinciaId: number;
  distritoId: number;
  telefono: string | null;
  whatsapp: string | null;
  fotoUrl?: string | null;
  activo: boolean;
  ugel?: { nombre: string };
  provincia?: { nombre: string };
  distrito?: { nombre: string };
}

interface Formulario {
  codigoModular: string;
  nombre: string;
  nivel: string;
  turno: string;
  zona: string;
  ugelId: string;
  provinciaId: string;
  distritoId: string;
  telefono: string;
  whatsapp: string;
  fotoUrl: string;
  activo: boolean;
}

const vacio: Formulario = {
  codigoModular: '', nombre: '', nivel: 'PRIMARIA', turno: 'MANANA', zona: 'URBANA',
  ugelId: '', provinciaId: '', distritoId: '', telefono: '', whatsapp: '', fotoUrl: '', activo: true,
};

export function InstitucionesPage() {
  const { puede } = useAuth();
  const puedeCrear = puede('ADMIN_GRED', 'EDITOR_UGEL');
  const puedeEditar = puede('ADMIN_GRED');
  const cliente = useQueryClient();
  const [pagina, setPagina] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState<Institucion | null>(null);
  const [desactivando, setDesactivando] = useState<Institucion | null>(null);
  const [formulario, setFormulario] = useState<Formulario>(vacio);
  const [subiendo, setSubiendo] = useState(false);
  const ugeles = useUgeles();
  const provincias = useProvincias();
  const distritos = useDistritos(formulario.provinciaId ? Number(formulario.provinciaId) : '');
  const listado = useQuery({
    queryKey: ['instituciones', 'listado', pagina, busqueda],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(pagina), limit: '20', search: busqueda });
      return (await api.get<Pagina<Institucion>>(`/instituciones?${params}`)).data;
    },
  });

  function refrescar() {
    for (const clave of ['instituciones', 'vacantes', 'plazas', 'locales', 'alertas', 'dashboard', 'publico']) {
      void cliente.invalidateQueries({ queryKey: [clave] });
    }
  }
  const guardar = useMutation({
    mutationFn: ({ id, datos }: { id: number | null; datos: ReturnType<typeof institucionCreateSchema.parse> }) =>
      id === null ? api.post('/instituciones', datos) : api.put(`/instituciones/${id}`, datos),
    onSuccess: (_resultado, { id }) => {
      refrescar();
      toast.success(id === null ? 'Institución creada' : 'Institución actualizada');
      setAbierto(false);
    },
    onError: (error) => {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        toast.error('No hay espacio suficiente en el almacenamiento local para guardar la imagen.');
      } else {
        toast.error(mensajeDeError(error));
      }
    },
  });
  const desactivar = useMutation({
    mutationFn: (id: number) => api.delete(`/instituciones/${id}`),
    onSuccess: () => {
      refrescar();
      setDesactivando(null);
      toast.success('Institución desactivada');
    },
    onError: (error) => toast.error(mensajeDeError(error)),
  });

  function abrir(ie: Institucion | null) {
    setEditando(ie);
    setFormulario(ie ? {
      codigoModular: ie.codigoModular, nombre: ie.nombre, nivel: ie.nivel, turno: ie.turno, zona: ie.zona,
      ugelId: String(ie.ugelId), provinciaId: String(ie.provinciaId), distritoId: String(ie.distritoId),
      telefono: ie.telefono ?? '', whatsapp: ie.whatsapp ?? '', fotoUrl: ie.fotoUrl ?? '', activo: ie.activo,
    } : vacio);
    setAbierto(true);
  }
  function enviar(evento: FormEvent) {
    evento.preventDefault();
    const imagen = formulario.fotoUrl.trim();
    const imagenDemo = import.meta.env.VITE_APP_DEMO === 'true' && /^data:image\/(?:avif|jpeg|png|webp);base64,/i.test(imagen);
    const resultado = institucionCreateSchema.safeParse({
      ...formulario, fotoUrl: imagenDemo ? 'https://demo.invalid/imagen' : imagen || null,
    });
    if (!resultado.success) {
      toast.error(resultado.error.errors[0]?.message ?? 'Revisa los datos de la institución.');
      return;
    }
    if (!distritos.data?.some((distrito) => distrito.id === resultado.data.distritoId)) {
      toast.error('Selecciona un distrito de la provincia elegida.');
      return;
    }
    guardar.mutate({ id: editando?.id ?? null, datos: { ...resultado.data, fotoUrl: imagenDemo ? imagen : resultado.data.fotoUrl } });
  }
  const opciones = (items: { id: number; nombre: string }[] | undefined) =>
    (items ?? []).map((item) => ({ valor: item.id, etiqueta: item.nombre }));
  const cambiar = (campo: keyof Formulario, valor: string | boolean) =>
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }));

  return (
    <div className="space-y-5">
      <EncabezadoPagina titulo="Instituciones educativas" icono={School} descripcion="Gestiona las instituciones y sus fotos para vacantes y plazas." accion={puedeCrear ? { etiqueta: 'Nueva institución', onClick: () => abrir(null) } : undefined} />
      {import.meta.env.VITE_APP_DEMO === 'true' && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Los cambios se guardan en este dispositivo y no se reflejan en el landing.</p>}
      {import.meta.env.MODE === 'demo-conectada' && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Datos de demostración compartidos mediante la API local. Las fotos aparecen en vacantes y plazas visibles del landing.</p>}
      <CampoTexto etiqueta="Buscar institución" tipo="search" valor={busqueda} onChange={(valor) => { setBusqueda(valor); setPagina(1); }} placeholder="Nombre o código modular" />
      {listado.isLoading && <p role="status">Cargando instituciones...</p>}
      {listado.isError && <p role="alert">No se pudieron cargar las instituciones. <button type="button" className="underline" onClick={() => void listado.refetch()}>Reintentar</button></p>}
      {listado.data && <div className="space-y-3">
        {listado.data.data.length === 0 && <p className="rounded-xl border border-outline-variant bg-white p-6 text-center">No hay instituciones para mostrar.</p>}
        {listado.data.data.map((ie) => <article key={ie.id} className="rounded-xl border border-outline-variant bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-primary">Código modular: {ie.codigoModular}</p>
              <h2 className="mt-1 text-lg font-semibold">{ie.nombre}</h2>
              <p className="mt-1 text-sm text-on-surface-variant">{[ie.distrito?.nombre, ie.provincia?.nombre, ie.ugel?.nombre].filter(Boolean).join(' · ')}</p>
              {(ie.telefono || ie.whatsapp) && <p className="mt-1 text-sm text-on-surface-variant">{[ie.telefono, ie.whatsapp && `WhatsApp: ${ie.whatsapp}`].filter(Boolean).join(' · ')}</p>}
            </div>
            <Badge tono={ie.activo ? 'exito' : 'neutro'}>{ie.activo ? 'Activa' : 'Inactiva'}</Badge>
          </div>
          {ie.fotoUrl && <img src={ie.fotoUrl} alt={`Institución educativa ${ie.nombre}`} className="mt-3 h-32 w-48 rounded-lg object-cover" />}
          {puedeEditar && <div className="mt-4 flex flex-wrap gap-2">
            <Boton variante="secundario" tamano="sm" onClick={() => abrir(ie)}><Pencil size={15} /> Editar</Boton>
            {ie.activo && <Boton variante="peligro" tamano="sm" onClick={() => setDesactivando(ie)}><Trash2 size={15} /> Desactivar</Boton>}
          </div>}
        </article>)}
        <Paginacion pagina={listado.data.meta.page} totalPaginas={listado.data.meta.totalPages} total={listado.data.meta.total} onPagina={setPagina} cargando={listado.isFetching} />
      </div>}
      <Modal abierto={abierto} onCerrar={() => { if (!subiendo && !guardar.isPending) setAbierto(false); }} titulo={editando ? 'Editar institución' : 'Nueva institución'}>
        <form onSubmit={enviar} className="space-y-4">
          <CampoTexto etiqueta="Nombre" valor={formulario.nombre} onChange={(valor) => cambiar('nombre', valor)} />
          <CampoTexto etiqueta="Código modular" valor={formulario.codigoModular} onChange={(valor) => cambiar('codigoModular', valor)} ayuda="De 6 a 7 dígitos." />
          <CampoSelect etiqueta="Nivel" valor={formulario.nivel} onChange={(valor) => cambiar('nivel', valor)} opciones={NIVELES.map((v) => ({ valor: v, etiqueta: ETIQUETAS_NIVEL[v] }))} />
          <CampoSelect etiqueta="Turno" valor={formulario.turno} onChange={(valor) => cambiar('turno', valor)} opciones={TURNOS.map((v) => ({ valor: v, etiqueta: ETIQUETAS_TURNO[v] }))} />
          <CampoSelect etiqueta="Zona" valor={formulario.zona} onChange={(valor) => cambiar('zona', valor)} opciones={ZONAS.map((v) => ({ valor: v, etiqueta: ETIQUETAS_ZONA[v] }))} />
          {(ugeles.isError || provincias.isError || distritos.isError) && <p role="alert" className="text-sm text-error">No se pudieron cargar los catálogos. <button type="button" className="underline" onClick={() => { void ugeles.refetch(); void provincias.refetch(); void distritos.refetch(); }}>Reintentar</button></p>}
          <CampoSelect etiqueta="UGEL" valor={formulario.ugelId} onChange={(valor) => cambiar('ugelId', valor)} opciones={opciones(ugeles.data)} />
          <CampoSelect etiqueta="Provincia" valor={formulario.provinciaId} onChange={(valor) => setFormulario((anterior) => ({ ...anterior, provinciaId: valor, distritoId: '' }))} opciones={opciones(provincias.data)} />
          <CampoSelect etiqueta="Distrito" valor={formulario.distritoId} onChange={(valor) => cambiar('distritoId', valor)} opciones={opciones(distritos.data)} deshabilitado={!formulario.provinciaId || distritos.isLoading} />
          <CampoTexto etiqueta="Teléfono (opcional)" tipo="tel" valor={formulario.telefono} onChange={(valor) => cambiar('telefono', valor)} />
          <CampoTexto etiqueta="WhatsApp (opcional)" tipo="tel" valor={formulario.whatsapp} onChange={(valor) => cambiar('whatsapp', valor)} ayuda="Solo dígitos, con código de país opcional." />
          <CampoTexto etiqueta="URL de foto (opcional)" valor={formulario.fotoUrl.startsWith('data:') ? '' : formulario.fotoUrl} onChange={(valor) => cambiar('fotoUrl', valor)} ayuda="Pega una URL pública o selecciona una imagen." />
          <CampoCargaArchivo etiqueta="Foto de la institución" tipo="imagen" archivos={formulario.fotoUrl ? [formulario.fotoUrl] : []} onChange={(archivos) => cambiar('fotoUrl', archivos[0] ?? '')} onSubiendoChange={setSubiendo} />
          {import.meta.env.VITE_APP_DEMO !== 'true' && <p className="text-xs text-on-surface-variant">Las imágenes cargadas son públicas. No adjuntes información confidencial.</p>}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={formulario.activo} onChange={(e) => cambiar('activo', e.target.checked)} /> Institución activa</label>
          <div className="flex justify-end gap-2">
            <Boton type="button" variante="secundario" onClick={() => setAbierto(false)} disabled={guardar.isPending || subiendo}>Cancelar</Boton>
            <Boton type="submit" disabled={guardar.isPending || subiendo}>{guardar.isPending ? 'Guardando...' : 'Guardar'}</Boton>
          </div>
        </form>
      </Modal>
      <Confirmacion abierto={!!desactivando} titulo="Desactivar institución" mensaje={`¿Desactivar «${desactivando?.nombre ?? ''}»? Sus registros vinculados no se eliminan y pueden seguir apareciendo. Puedes volver a activarla al editarla.`} etiquetaConfirmar="Desactivar" onCancelar={() => setDesactivando(null)} onConfirmar={() => { if (desactivando) desactivar.mutate(desactivando.id); }} cargando={desactivar.isPending} />
    </div>
  );
}

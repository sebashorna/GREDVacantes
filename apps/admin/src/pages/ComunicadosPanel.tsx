import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { CATEGORIAS_COMUNICADO, comunicadoCreateSchema, type CategoriaComunicado } from '@shared';

import { EncabezadoPagina } from '@/components/EncabezadoPagina';
import { Badge } from '@/components/ui/Badge';
import { Boton } from '@/components/ui/Boton';
import { CampoArea, CampoSelect, CampoTexto } from '@/components/ui/Campo';
import { CampoCargaArchivo } from '@/components/ui/CampoCargaArchivo';
import { Confirmacion } from '@/components/ui/Confirmacion';
import { Modal } from '@/components/ui/Modal';
import { Paginacion } from '@/components/ui/Paginacion';
import { VistaPreviaArchivo } from '@/components/ui/VistaPreviaArchivo';
import { useAuth, mensajeDeError } from '@/features/auth/auth-context';
import { api } from '@/lib/api';
import type { Pagina } from '@/lib/tipos';

interface Comunicado {
  id: string;
  titulo: string;
  categoria: string;
  resumen: string;
  contenido: string | null;
  fecha: string;
  imagenUrl: string | null;
  documentoUrl?: string | null;
  publicado: boolean;
}

interface Formulario {
  titulo: string;
  categoria: string;
  resumen: string;
  contenido: string;
  fecha: string;
  imagenUrl: string;
  documentoUrl: string;
  publicado: boolean;
}

const vacio: Formulario = {
  titulo: '', categoria: 'SERVICIO', resumen: '', contenido: '',
  fecha: '', imagenUrl: '', documentoUrl: '', publicado: false,
};

const categorias: Record<CategoriaComunicado, string> = {
  MATERIALES: 'Materiales',
  CAPACITACION: 'Capacitación',
  CONVOCATORIA: 'Convocatoria',
  NORMATIVA: 'Normativa',
  SERVICIO: 'Servicio',
};

function etiqueta(valor: string) {
  const categoria = CATEGORIAS_COMUNICADO.find((opcion) => opcion === valor);
  return categoria ? categorias[categoria] : valor;
}

export function ComunicadosPanel() {
  const { usuario, puede } = useAuth();
  const queryClient = useQueryClient();
  const puedeCrear = puede('ADMIN_GRED', 'EDITOR_UGEL');
  const puedeEditar = puede('ADMIN_GRED');
  const [pagina, setPagina] = useState(1);
  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState<Comunicado | null>(null);
  const [eliminando, setEliminando] = useState<Comunicado | null>(null);
  const [formulario, setFormulario] = useState<Formulario>(vacio);
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [subiendoDocumento, setSubiendoDocumento] = useState(false);
  const comunicados = useQuery({
    queryKey: ['comunicados', pagina, puedeCrear],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(pagina), limit: '20' });
      if (!puedeCrear) params.set('publicado', 'true');
      const { data } = await api.get<Pagina<Comunicado>>(`/comunicados?${params}`);
      return data;
    },
    enabled: !!usuario,
  });

  function refrescar() {
    void queryClient.invalidateQueries({ queryKey: ['comunicados'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    void queryClient.invalidateQueries({ queryKey: ['publico', 'comunicados'] });
  }

  const guardar = useMutation({
    mutationFn: async ({ id, datos }: { id: string | null; datos: { titulo: string; categoria: CategoriaComunicado; resumen: string; contenido: string | null; fecha: Date; imagenUrl: string | null; documentoUrl: string | null; publicado: boolean } }) => {
      if (id) return api.put(`/comunicados/${encodeURIComponent(id)}`, datos);
      return api.post('/comunicados', datos);
    },
    onSuccess: (_resultado, variables) => {
      refrescar();
      toast.success(variables.id ? 'Comunicado actualizado' : 'Comunicado creado');
      setAbierto(false);
    },
    onError: (error) => {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        toast.error('No hay espacio suficiente en el almacenamiento local para guardar los archivos.');
        return;
      }
      toast.error(mensajeDeError(error));
    },
  });
  const eliminar = useMutation({
    mutationFn: (id: string) => api.delete(`/comunicados/${encodeURIComponent(id)}`),
    onSuccess: () => {
      refrescar();
      if (pagina > 1 && comunicados.data?.data.length === 1) setPagina(pagina - 1);
      setEliminando(null);
      toast.success('Comunicado eliminado');
    },
    onError: (error) => toast.error(mensajeDeError(error)),
  });

  function abrir(comunicado: Comunicado | null) {
    setEditando(comunicado);
    setFormulario(comunicado ? {
      titulo: comunicado.titulo,
      categoria: comunicado.categoria,
      resumen: comunicado.resumen,
      contenido: comunicado.contenido ?? '',
      fecha: comunicado.fecha.slice(0, 10),
      imagenUrl: comunicado.imagenUrl ?? '',
      documentoUrl: comunicado.documentoUrl ?? '',
      publicado: comunicado.publicado,
    } : vacio);
    setAbierto(true);
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    const imagen = formulario.imagenUrl.trim();
    const documento = formulario.documentoUrl.trim();
    const imagenDemo = import.meta.env.VITE_APP_DEMO === 'true' && /^data:image\/(?:avif|jpeg|png|webp);base64,/i.test(imagen);
    const documentoDemo = import.meta.env.VITE_APP_DEMO === 'true' && /^data:application\/pdf;base64,/i.test(documento);
    if (!formulario.fecha) {
      toast.error('Selecciona la fecha de publicación.');
      return;
    }
    const resultado = comunicadoCreateSchema.safeParse({
      ...formulario,
      fecha: formulario.fecha ? `${formulario.fecha}T00:00:00.000Z` : 'fecha inválida',
      contenido: formulario.contenido.trim() || null,
      imagenUrl: imagenDemo ? 'https://demo.invalid/imagen' : imagen || null,
      documentoUrl: documentoDemo ? 'https://demo.invalid/documento' : documento || null,
    });
    if (!resultado.success) {
      toast.error(resultado.error.errors[0]?.message ?? 'Revisa los datos del comunicado.');
      return;
    }
    guardar.mutate({ id: editando?.id ?? null, datos: { ...resultado.data, contenido: resultado.data.contenido ?? null, imagenUrl: imagenDemo ? imagen : resultado.data.imagenUrl ?? null, documentoUrl: documentoDemo ? documento : resultado.data.documentoUrl ?? null } });
  }

  return (
    <div className="space-y-5">
      <EncabezadoPagina titulo="Comunicados y avisos" icono={Megaphone} descripcion="Consulta y gestiona las publicaciones para la comunidad educativa." accion={puedeCrear ? { etiqueta: 'Nuevo comunicado', onClick: () => abrir(null) } : undefined} />
      {import.meta.env.VITE_APP_DEMO === 'true' && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">En demostración los cambios se guardan en este dispositivo y no se reflejan en el landing ni en otros dispositivos.</p>}
      {import.meta.env.MODE === 'demo-conectada' && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Demostración con datos de prueba compartidos por la API local. Solo los comunicados publicados aparecen en el landing.</p>}
      {comunicados.isLoading && <p className="p-5 text-sm text-on-surface-variant" role="status">Cargando comunicados...</p>}
      {comunicados.isError && <p role="alert" className="rounded-lg bg-error-container p-4 text-on-error-container">No se pudieron cargar los comunicados. <button type="button" className="font-semibold underline" onClick={() => void comunicados.refetch()}>Reintentar</button></p>}
      {comunicados.data && (
        <div className="space-y-3">
          {comunicados.data.data.length === 0 && <p className="rounded-xl border border-outline-variant bg-white p-6 text-center text-sm text-on-surface-variant">No hay comunicados para mostrar.</p>}
          {comunicados.data.data.map((comunicado) => (
            <article key={comunicado.id} className="rounded-xl border border-outline-variant bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-primary">{etiqueta(comunicado.categoria)} · {new Date(comunicado.fecha).toLocaleDateString('es-PE', { timeZone: 'UTC', dateStyle: 'medium' })}</p>
                  <h2 className="mt-1 text-lg font-semibold">{comunicado.titulo}</h2>
                </div>
                <Badge tono={comunicado.publicado ? 'exito' : 'neutro'}>{comunicado.publicado ? 'Publicado' : 'Borrador'}</Badge>
              </div>
              <p className="mt-2 text-sm text-on-surface-variant">{comunicado.resumen}</p>
              {comunicado.contenido && <p className="mt-3 whitespace-pre-wrap text-sm">{comunicado.contenido}</p>}
              <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-primary">
                {comunicado.imagenUrl && <VistaPreviaArchivo url={comunicado.imagenUrl} titulo={`Imagen: ${comunicado.titulo}`} tipo="imagen"><span className="hover:underline">Ver imagen</span></VistaPreviaArchivo>}
                {comunicado.documentoUrl && <VistaPreviaArchivo url={comunicado.documentoUrl} titulo={`Documento: ${comunicado.titulo}`} tipo="documento"><span className="hover:underline">Ver PDF</span></VistaPreviaArchivo>}
              </div>
              {puedeEditar && <div className="mt-4 flex flex-wrap gap-2">
                <Boton variante="secundario" tamano="sm" onClick={() => abrir(comunicado)}><Pencil size={15} /> Editar</Boton>
                <Boton variante="peligro" tamano="sm" onClick={() => setEliminando(comunicado)}><Trash2 size={15} /> Eliminar</Boton>
              </div>}
            </article>
          ))}
          <Paginacion pagina={comunicados.data.meta.page} totalPaginas={comunicados.data.meta.totalPages} total={comunicados.data.meta.total} onPagina={setPagina} cargando={comunicados.isFetching} />
        </div>
      )}
      <Modal abierto={abierto} onCerrar={() => { if (!subiendoImagen && !subiendoDocumento && !guardar.isPending) setAbierto(false); }} titulo={editando ? 'Editar comunicado' : 'Nuevo comunicado'}>
        <form onSubmit={enviar} className="space-y-4">
          <CampoTexto etiqueta="Título" valor={formulario.titulo} onChange={(titulo) => setFormulario({ ...formulario, titulo })} ayuda="Entre 5 y 200 caracteres." />
          <CampoSelect etiqueta="Categoría" valor={formulario.categoria} onChange={(categoria) => setFormulario({ ...formulario, categoria })} opciones={CATEGORIAS_COMUNICADO.map((categoria) => ({ valor: categoria, etiqueta: etiqueta(categoria) }))} ayuda={formulario.categoria && !CATEGORIAS_COMUNICADO.some((categoria) => categoria === formulario.categoria) ? 'Selecciona una categoría válida para este comunicado de ejemplo.' : undefined} />
          <CampoArea etiqueta="Resumen" valor={formulario.resumen} onChange={(resumen) => setFormulario({ ...formulario, resumen })} ayuda="Entre 10 y 500 caracteres." />
          <CampoArea etiqueta="Contenido (opcional)" valor={formulario.contenido} onChange={(contenido) => setFormulario({ ...formulario, contenido })} />
          <CampoTexto etiqueta="Fecha de publicación" tipo="date" valor={formulario.fecha} onChange={(fecha) => setFormulario({ ...formulario, fecha })} />
          <CampoTexto etiqueta="URL de imagen (opcional)" tipo="text" valor={formulario.imagenUrl.startsWith('data:') ? '' : formulario.imagenUrl} onChange={(imagenUrl) => setFormulario((anterior) => ({ ...anterior, imagenUrl }))} ayuda="Pega una URL o selecciona una imagen. Una imagen reemplaza la anterior." />
          <CampoCargaArchivo etiqueta="Adjuntar imagen" tipo="imagen" archivos={formulario.imagenUrl ? [formulario.imagenUrl] : []} onChange={(archivos) => setFormulario((anterior) => ({ ...anterior, imagenUrl: archivos[0] ?? '' }))} onSubiendoChange={setSubiendoImagen} />
          <CampoTexto etiqueta="URL de PDF (opcional)" tipo="text" valor={formulario.documentoUrl.startsWith('data:') ? '' : formulario.documentoUrl} onChange={(documentoUrl) => setFormulario((anterior) => ({ ...anterior, documentoUrl }))} ayuda="Pega una URL o selecciona un PDF. Un archivo reemplaza el anterior." />
          <CampoCargaArchivo etiqueta="Adjuntar PDF" tipo="pdf" archivos={formulario.documentoUrl ? [formulario.documentoUrl] : []} onChange={(archivos) => setFormulario((anterior) => ({ ...anterior, documentoUrl: archivos[0] ?? '' }))} onSubiendoChange={setSubiendoDocumento} />
          {import.meta.env.VITE_APP_DEMO !== 'true' && <p className="text-xs text-on-surface-variant">Los archivos subidos son públicos, incluso si el comunicado es un borrador. No adjuntes información confidencial.</p>}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={formulario.publicado} onChange={(e) => setFormulario({ ...formulario, publicado: e.target.checked })} /> Publicar comunicado</label>
          <div className="flex justify-end gap-2">
            <Boton type="button" variante="secundario" onClick={() => setAbierto(false)} disabled={guardar.isPending || subiendoImagen || subiendoDocumento}>Cancelar</Boton>
            <Boton type="submit" disabled={guardar.isPending || subiendoImagen || subiendoDocumento}>{guardar.isPending ? 'Guardando...' : 'Guardar'}</Boton>
          </div>
        </form>
      </Modal>
      <Confirmacion abierto={!!eliminando} titulo="Eliminar comunicado" mensaje={`¿Deseas eliminar «${eliminando?.titulo ?? ''}»? Esta acción no se puede deshacer.`} onCancelar={() => setEliminando(null)} onConfirmar={() => { if (eliminando) eliminar.mutate(eliminando.id); }} cargando={eliminar.isPending} />
    </div>
  );
}

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { mensajeDeError } from '@/features/auth/auth-context';
import { EncabezadoPagina } from '@/components/EncabezadoPagina';
import { Boton } from '@/components/ui/Boton';
import { CampoSelect, CampoTexto } from '@/components/ui/Campo';
import { Modal } from '@/components/ui/Modal';
import { Tabla, type Columna } from '@/components/ui/Tabla';
import { Badge, type TonoBadge } from '@/components/ui/Badge';

export const TIPO_IMPORTACION = ['INSTITUCIONES','LOCALES','PLAZAS'] as const;
export type TipoImportacion = (typeof TIPO_IMPORTACION)[number];

export interface ResultadoFila {
  fila: number;
  estado: 'IMPORTADA'|'ACTUALIZADA'|'ERROR';
  mensaje?: string;
  codigo?: string;
}

export interface ResumenImportacion {
  tipo: TipoImportacion;
  total: number;
  importadas: number;
  actualizadas: number;
  errores: number;
  detalle: ResultadoFila[];
}

const ETIQUETAS_TIPO: Record<TipoImportacion,string> = { INSTITUCIONES:'Instituciones', LOCALES:'Locales', PLAZAS:'Plazas' };
const ESTATUS_IMPORTACION: Record<ResultadoFila['estado'],string> = { IMPORTADA:'Importada', ACTUALIZADA:'Actualizada', ERROR:'Error' };
const TONOS_ESTADO: Record<ResultadoFila['estado'], TonoBadge> = { IMPORTADA:'exito', ACTUALIZADA:'info', ERROR:'error' };

export function ImportacionPage() {
  const [tipo,setTipo] = useState<TipoImportacion|''>('');
  const [archivo,setArchivo] = useState<File|null>(null);
  const [modalAbierto,setModalAbierto] = useState(false);
  const [resultado,setResultado] = useState<ResumenImportacion|null>(null);
  const [error,setError] = useState<string|null>(null);
  const [filaSeleccionada,setFilaSeleccionada] = useState<ResultadoFila|null>(null);
  const { mutate: importar, isPending } = useMutation({
    mutationFn: async ({tipo:t,archivo:file}: {tipo:TipoImportacion;archivo:File}) => {
      const fd = new FormData();
      fd.append('tipo', t);
      fd.append('archivo', file);
      const {data} = await api.post<ResumenImportacion>('/importacion', fd, {headers: {'Content-Type':'multipart/form-data'}});
      return data;
    },
    onSuccess: (resumen) => {
      setResultado(resumen);
      setModalAbierto(false);
      toast.success(`ImportaciÃ³n completada: ${resumen.importadas} importadas, ${resumen.actualizadas} actualizadas, ${resumen.errores} errores`);
    },
    onError: (error) => {
      setError(mensajeDeError(error));
      toast.error(mensajeDeError(error));
    },
  });
  const iniciarImportacion = () => {
    if(!tipo || !archivo) { toast.error('Seleccione un tipo y un archivo CSV.'); return; }
    importar({tipo,archivo});
  };
  const columnas: Columna<ResultadoFila>[] = [
    { clave: 'fila', encabezado: 'Fila', celda: (fila) => fila.fila },
    {
      clave: 'estado',
      encabezado: 'Estado',
      celda: (fila) => <Badge tono={TONOS_ESTADO[fila.estado]}>{ESTATUS_IMPORTACION[fila.estado]}</Badge>,
    },
    { clave: 'codigo', encabezado: 'Código', celda: (fila) => fila.codigo },
    { clave: 'mensaje', encabezado: 'Mensaje', celda: (fila) => fila.mensaje },
  ];
  return (
    <div className="space-y-6">
      <EncabezadoPagina titulo="ImportaciÃ³n CSV" descripcion="Carga masiva de instituciones, locales y plazas desde CSV." accion={{etiqueta:'Nueva importaciÃ³n', onClick:()=>setModalAbierto(true)}} />
      <div className="bg-white rounded-xl border border-outline-variant p-4">
        <label className="block text-label mb-2">Tipo de importaciÃ³n</label>
        <select value={tipo} onChange={(e)=>setTipo(e.target.value as TipoImportacion|'')} className="w-full h-12 px-3.5 rounded-lg border-[1.5px] border-outline-variant bg-white cursor-pointer">
          <option value="">Seleccione un tipo</option>
          {TIPO_IMPORTACION.map((t) => <option key={t} value={t}>{ETIQUETAS_TIPO[t]}</option>)}
        </select>
      </div>
      <div className="bg-white rounded-xl border border-outline-variant p-4">
        <label className="block text-label mb-2">Archivo CSV</label>
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-outline-variant rounded-lg p-8 text-center">
          <p className="text-slate-500 mb-2">Arrastre y suelte su archivo CSV aquÃ­</p>
          <p className="text-sm text-slate-400">o haz clic para seleccionar</p>
          <input type="file" accept=".csv" className="hidden" onChange={(e)=>setArchivo(e.target.files?.[0]||null)} />
          <Boton variante="secundario" tamano="sm" onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}>Seleccionar archivo</Boton>
        </div>
        <div className="mt-4">
          <Boton variante="primario" onClick={iniciarImportacion} disabled={isPending}>{isPending?'Importando...':'Importar'}</Boton>
        </div>
        {error && <p className="text-sm text-error mt-2">{error}</p>}
      </div>
      {resultado && (
        <div className="bg-white rounded-xl border border-outline-variant p-4">
          <h3 className="text-lg font-semibold mb-2">Resumen</h3>
          <div className="grid grid-cols-4 gap-4 mb-4 text-center">
            <div><p className="text-2xl font-bold text-exito">{resultado.importadas}</p><p className="text-xs text-slate-500">Importadas</p></div>
            <div><p className="text-2xl font-bold text-info">{resultado.actualizadas}</p><p className="text-xs text-slate-500">Actualizadas</p></div>
            <div><p className="text-2xl font-bold text-error">{resultado.errores}</p><p className="text-xs text-slate-500">Errores</p></div>
            <div><p className="text-2xl font-bold text-slate-500">{resultado.total}</p><p className="text-xs text-slate-500">Total</p></div>
          </div>
          {resultado.detalle.length>0 && (
            <div>
              <h4 className="text-md font-semibold mb-2">Detalles</h4>
              <Tabla columnas={columnas} filas={resultado.detalle} claveFila={(fila) => fila.fila} acciones={(fila) => <Boton variante="secundario" tamano="sm" onClick={()=>setFilaSeleccionada(fila)}>Ver</Boton>} />
            </div>
          )}
        </div>
      )}
      <Modal abierto={modalAbierto} onCerrar={()=>setModalAbierto(false)} titulo="ImportaciÃ³n masiva">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Seleccione el tipo de datos a importar y arrastre su archivo CSV.</p>
          <CampoSelect etiqueta="Tipo" valor={tipo} onChange={(valor) => setTipo(valor as TipoImportacion | '')} opciones={TIPO_IMPORTACION.map((t) => ({valor:t,etiqueta:ETIQUETAS_TIPO[t]}))} />
          <CampoTexto etiqueta="Archivo" valor={archivo?.name||''} onChange={() => {}} deshabilitado ayuda="Haga clic en el botÃ³n 'Seleccionar archivo' para cargar un CSV." />
          <div className="flex justify-end gap-2">
            <Boton variante="secundario" onClick={() => setModalAbierto(false)}>Cancelar</Boton>
            <Boton variante="primario" onClick={iniciarImportacion} disabled={isPending}>{isPending?'Importando...':'Importar'}</Boton>
          </div>
        </div>
      </Modal>
      {filaSeleccionada && <div className="p-4 bg-white rounded-xl border border-outline-variant"><p className="text-sm text-slate-600">Fila {filaSeleccionada.fila}: {filaSeleccionada.mensaje ?? 'Sin detalle'}</p></div>}
    </div>
  );
}




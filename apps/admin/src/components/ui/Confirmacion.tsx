import { Modal } from './Modal';
import { Boton } from './Boton';

/**
 * Diálogo de confirmación para acciones destructivas (eliminar).
 */
interface ConfirmacionProps {
  abierto: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
  titulo?: string;
  mensaje: string;
  etiquetaConfirmar?: string;
  cargando?: boolean;
}

export function Confirmacion({
  abierto,
  onConfirmar,
  onCancelar,
  titulo = 'Confirmar accion',
  mensaje,
  etiquetaConfirmar = 'Eliminar',
  cargando = false,
}: ConfirmacionProps) {
  return (
    <Modal
      abierto={abierto}
      onCerrar={onCancelar}
      titulo={titulo}
      ancho="md"
      pie={
        <>
          <Boton variante="secundario" onClick={onCancelar} disabled={cargando}>
            Cancelar
          </Boton>
          <Boton variante="peligro" onClick={onConfirmar} disabled={cargando}>
            {cargando ? 'Procesando...' : etiquetaConfirmar}
          </Boton>
        </>
      }
    >
      <p className="text-sm text-on-surface">{mensaje}</p>
    </Modal>
  );
}

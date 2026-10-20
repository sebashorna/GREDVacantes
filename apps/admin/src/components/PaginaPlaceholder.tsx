interface PaginaPlaceholderProps {
  titulo: string;
  descripcion: string;
}

export function PaginaPlaceholder({ titulo, descripcion }: PaginaPlaceholderProps) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">{titulo}</h1>
      <p className="text-slate-600">{descripcion}</p>
      <p className="mt-4 text-sm text-slate-500">
        Pantalla en desarrollo (pr&oacute;ximo paso del plan de implementaci&oacute;n).
      </p>
    </div>
  );
}
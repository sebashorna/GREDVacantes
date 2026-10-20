import { useAuth } from '@/features/auth/auth-context';
import { EncabezadoPagina } from '@/components/EncabezadoPagina';


export function AlertasPage() {
  useAuth();
  return (
    <div className="space-y-6">
      <EncabezadoPagina
        titulo="Alertas"
        descripcion="Gestión de alertas."
      />
      <p>Contenido de alertas.</p>
    </div>
  );
}

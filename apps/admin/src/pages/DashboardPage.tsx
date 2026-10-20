import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/features/auth/auth-context';

interface DatoDashboard {
  instituciones: number;
  vacantes: number;
  plazas: number;
  locales: number;
  alertasAbiertas: number;
  comunicadosPublicados: number;
}

export function DashboardPage() {
  const { usuario } = useAuth();
  const [datos, setDatos] = useState<DatoDashboard | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await api.get<DatoDashboard>('/dashboard');
      return data;
    },
    enabled: !!usuario,
  });

  useEffect(() => {
    if (data) setDatos(data);
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        Cargando panel...
      </div>
    );
  }

  // Tarjetas con acento izquierdo terracota (spec Cards del mockup:
  // "4px primary terracotta left-border accent") sobre outline sándrail.
  const tarjetas = [
    { label: 'Instituciones', valor: datos?.instituciones ?? 0 },
    { label: 'Vacantes', valor: datos?.vacantes ?? 0 },
    { label: 'Plazas', valor: datos?.plazas ?? 0 },
    { label: 'Locales', valor: datos?.locales ?? 0 },
    { label: 'Alertas abiertas', valor: datos?.alertasAbiertas ?? 0 },
    { label: 'Comunicados publicados', valor: datos?.comunicadosPublicados ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Panel de Control</h1>
          <p className="text-slate-500">Resumen de la Gerencia Regional de Educación de Lambayeque</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-3 py-2 border border-outline-variant rounded-lg hover:bg-surface-container-low text-on-surface-variant font-medium transition bg-white"
        >
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tarjetas.map((t) => (
          <div key={t.label} className="p-5 rounded-xl bg-white border border-outline-variant border-l-4 border-l-primary-container">
            <p className="text-sm font-medium text-slate-500 mb-1">{t.label}</p>
            <p className="text-3xl font-bold text-primary">{t.valor}</p>
          </div>
        ))}
      </div>

      <div className="p-5 rounded-xl bg-white border border-outline-variant">
        <h2 className="text-sm font-semibold text-on-surface mb-3">Sesion activa</h2>
        <p className="text-sm text-slate-600">
          Usuario: <span className="font-medium">{usuario?.nombre}</span> ({usuario?.email})
        </p>
        <p className="text-sm text-slate-600">
          Rol: <span className="font-semibold text-slate-700 capitalize">{usuario?.rol}</span>
        </p>
      </div>
    </div>
  );
}

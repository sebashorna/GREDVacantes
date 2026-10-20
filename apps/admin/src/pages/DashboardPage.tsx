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

  const tarjetas = [
    { label: 'Instituciones', valor: datos?.instituciones ?? 0, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Vacantes', valor: datos?.vacantes ?? 0, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Plazas', valor: datos?.plazas ?? 0, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Locales', valor: datos?.locales ?? 0, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Alertas abiertas', valor: datos?.alertasAbiertas ?? 0, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Comunicados publicados', valor: datos?.comunicadosPublicados ?? 0, color: 'text-violet-600', bg: 'bg-violet-50' },
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
          className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600 font-medium transition"
        >
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tarjetas.map((t) => (
          <div key={t.label} className={`p-5 rounded-xl ${t.bg} border border-slate-200`}>
            <p className="text-sm font-medium text-slate-500 mb-1">{t.label}</p>
            <p className="text-3xl font-bold {t.color}">{t.valor}</p>
          </div>
        ))}
      </div>

      <div className="p-5 rounded-xl bg-white border border-slate-200">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Sesion activa</h2>
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

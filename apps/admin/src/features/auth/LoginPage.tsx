import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAuth, mensajeDeError } from '@/features/auth/auth-context';
import { Mail, Lock, AlertCircle, ArrowLeft } from 'lucide-react';

interface LoginPageProps {
  modoAplicacion?: boolean;
}

const schema = z.object({
  email: z.string().email('Ingrese un correo v&aacute;lido'),
  password: z.string().min(1, 'La contrase&ntilde;a es obligatoria'),
});

export function LoginPage({ modoAplicacion = false }: LoginPageProps) {
  const navigate = useNavigate();
  const { iniciarSesion } = useAuth();
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    defaultValues: { email: 'admin@gredlambayeque.gob.pe', password: '' },
  });

  const onSubmit = async (datos: z.infer<typeof schema>) => {
    const resultado = schema.safeParse(datos);
    if (!resultado.success) {
      setError(resultado.error.errors[0]?.message ?? 'Datos inv&aacute;lidos');
      return;
    }
    setCargando(true);
    setError('');
    try {
      await iniciarSesion(datos.email, datos.password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className={`flex min-h-dvh items-center justify-center bg-background p-4 ${modoAplicacion ? 'h-full overflow-y-auto' : 'h-screen'}`}>
      <div className={`w-full bg-white border border-outline-variant ${modoAplicacion ? 'max-w-md rounded-2xl p-6 shadow-none sm:p-7' : 'max-w-md rounded-xl p-8 shadow-lg'}`}>
        <div className="mb-7 text-center">
          {modoAplicacion && (
            <img
              src="/Imagenes/GORE.png"
              alt="Gobierno Regional de Lambayeque"
              className="mx-auto mb-4 h-16 w-16 object-contain"
            />
          )}
          <h1 className="text-2xl font-bold text-primary">Educa Lambayeque</h1>
          <p className="mt-2 text-sm text-slate-500">
            {modoAplicacion ? 'Inicia sesión en la aplicación' : 'Panel Administrativo - Inicio de sesión'}
          </p>
        </div>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Correo electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                {...form.register('email')}
                type="email"
                className={`w-full pl-10 pr-4 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary-container focus:border-primary-container outline-none transition bg-white ${modoAplicacion ? 'py-3 text-sm' : 'py-2.5'}`}
                placeholder="admin@gredlambayeque.gob.pe"
              />
            </div>
            {form.formState.errors.email && (
              <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Contrase&ntilde;a</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                {...form.register('password')}
                type="password"
                className={`w-full pl-10 pr-4 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary-container focus:border-primary-container outline-none transition bg-white ${modoAplicacion ? 'py-3 text-sm' : 'py-2.5'}`}
                placeholder="••••••••"
              />
            </div>
            {form.formState.errors.password && (
              <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
            )}
          </div>
          {error && (
            <div className="rounded-lg bg-red-50 p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={cargando}
            className={`w-full bg-primary-container hover:bg-primary disabled:bg-primary-fixed-dim text-white rounded-lg font-medium transition flex items-center justify-center gap-2 py-3 ${modoAplicacion ? 'text-sm' : ''}`}
          >
            {cargando ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>
        {!modoAplicacion && <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            Usuarios de prueba: admin / editor / consultor
            <br />
            Contrase&ntilde;a: `Educa2025!`
          </p>
        </div>}
        {!modoAplicacion && (
          <p className="mt-5 text-center">
            <Link to="/" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
              <ArrowLeft size={15} /> Volver al inicio
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
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
  email: z.string().email('Ingrese un correo válido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export function LoginPage({ modoAplicacion = false }: LoginPageProps) {
  const navigate = useNavigate();
  const { iniciarSesion } = useAuth();
  const modoDemostracion = modoAplicacion && import.meta.env.VITE_APP_DEMO === 'true';
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    defaultValues: { email: modoDemostracion ? 'demo@educa.gob.pe' : 'admin@gredlambayeque.gob.pe', password: '' },
  });

  const onSubmit = async (datos: z.infer<typeof schema>) => {
    const resultado = schema.safeParse(datos);
    if (!resultado.success) {
      setError(resultado.error.errors[0]?.message ?? 'Datos inválidos');
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
    <div
      className={`flex min-h-dvh items-center justify-center bg-[#4b180f] bg-cover bg-center p-4 ${modoAplicacion ? 'h-full overflow-y-auto' : 'h-screen'}`}
      style={{
        backgroundImage:
          'linear-gradient(135deg, rgba(75, 24, 15, 0.94) 0%, rgba(129, 48, 25, 0.88) 55%, rgba(160, 71, 46, 0.8) 100%), url("/Imagenes/GoreUbigeo.jpg")',
      }}
    >
      <div className={`animar-aparicion w-full max-w-md border border-white/40 bg-white/95 shadow-2xl backdrop-blur-sm ${modoAplicacion ? 'rounded-2xl p-6 sm:p-7' : 'rounded-2xl p-8'}`}>
        <div className="mb-7 text-center">
          <img
            src="/Imagenes/GORE.png"
            alt="Gobierno Regional de Lambayeque"
            className="mx-auto mb-4 h-20 w-20 object-contain mix-blend-multiply"
          />
          <h1 className="text-2xl font-bold text-primary">Educa Lambayeque</h1>
          <p className="mt-2 text-sm text-slate-500">
            {modoAplicacion ? 'Inicia sesión en el panel administrativo' : 'Panel Administrativo - Inicio de sesión'}
          </p>
          {modoDemostracion && (
            <p className="mt-2 text-xs text-slate-500">
              Modo demostración: usa cualquier correo válido y una contraseña de muestra.
            </p>
          )}
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
            className={`w-full bg-gradient-to-r from-primary to-primary-container hover:brightness-110 disabled:opacity-60 text-white rounded-lg font-semibold shadow-md transition flex items-center justify-center gap-2 py-3 ${modoAplicacion ? 'text-sm' : ''}`}
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
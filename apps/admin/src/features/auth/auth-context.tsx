import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { api, normalizarError, tokens } from '@/lib/api';
import type { Rol } from '@shared';

const MODO_DEMOSTRACION = import.meta.env.VITE_APP_DEMO === 'true';
const MODO_MOVIL = import.meta.env.VITE_APP_MOBILE === 'true';
const MODO_CONSULTA_WEB = window.location.pathname === '/app/consulta';
const MODO_SOLO_CONSULTA = MODO_MOVIL || MODO_CONSULTA_WEB;
const CLAVE_SESION_DEMOSTRACION = 'educa.demoSession';
const USUARIO_CONSULTA: UsuarioAutenticado = {
  id: 0,
  nombre: 'Visitante ciudadano',
  email: 'consulta@educa.gob.pe',
  rol: 'CONSULTOR',
  ugelId: null,
  ugel: null,
};

export interface UsuarioAutenticado {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  ugelId: number | null;
  ugel: { id: number; nombre: string } | null;
}

interface ContextoAuth {
  usuario: UsuarioAutenticado | null;
  cargando: boolean;
  estaAutenticado: boolean;
  iniciarSesion(email: string, password: string): Promise<void>;
  cerrarSesion(): Promise<void>;
  puede(...roles: Rol[]): boolean;
}

const Contexto = createContext<ContextoAuth | null>(null);

export function ProveedorAuth({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioAutenticado | null>(null);
  const [cargando, setCargando] = useState(true);
  const queryClient = useQueryClient();

  /**
   * Restaura la sesion al cargar la aplicacion.
   *
   * Se pide el perfil a la API: si el token sigue siendo valido, la sesion
   * se conserva; si no, el interceptor ya habra intentado renovarlo.
   */
  const restaurar = useCallback(async () => {
    if (MODO_SOLO_CONSULTA) {
      tokens.clear();
      localStorage.removeItem(CLAVE_SESION_DEMOSTRACION);
      setUsuario(USUARIO_CONSULTA);
      setCargando(false);
      return;
    }
    if (MODO_DEMOSTRACION) {
      setUsuario(localStorage.getItem(CLAVE_SESION_DEMOSTRACION) === 'true' ? USUARIO_CONSULTA : null);
      setCargando(false);
      return;
    }
    if (!tokens.haySesion) {
      setCargando(false);
      return;
    }
    try {
      const { data } = await api.get<UsuarioAutenticado>('/auth/perfil');
      setUsuario(data);
    } catch {
      tokens.clear();
      setUsuario(null);
    } finally {
      setCargando(false);
    }
  }, []);

  // Restaura la sesion al montar la aplicacion.
  useEffect(() => {
    void restaurar();
  }, [restaurar]);

  const iniciarSesion = useCallback(async (email: string, password: string) => {
      if (MODO_SOLO_CONSULTA) {
        throw new Error('El modo de consulta ciudadana no permite iniciar sesión.');
      }
      if (MODO_DEMOSTRACION) {
        localStorage.setItem(CLAVE_SESION_DEMOSTRACION, 'true');
        setUsuario({
          ...USUARIO_CONSULTA,
          nombre: 'Consultor de demostración',
          email,
        });
        queryClient.clear();
        return;
      }

      const { data } = await api.post<{
        accessToken: string;
        refreshToken: string;
        usuario: UsuarioAutenticado;
      }>('/auth/login', { email, password });

      tokens.set(data.accessToken, data.refreshToken);
      setUsuario(data.usuario);
      queryClient.clear();
    },
    [queryClient],
  );

  const cerrarSesion = useCallback(async () => {
    const refresh = tokens.refresh;
    tokens.clear();
    localStorage.removeItem(CLAVE_SESION_DEMOSTRACION);
    setUsuario(null);
    queryClient.clear();
    if (refresh && !MODO_DEMOSTRACION) {
      // Best effort: si el servidor ya no reconoce el token, da igual.
      try {
        await api.post('/auth/logout', { refreshToken: refresh });
      } catch {
        /* intencionalmente ignorado */
      }
    }
  }, [queryClient]);

  const puede = useCallback(
    (...roles: Rol[]) => (usuario ? roles.includes(usuario.rol) : false),
    [usuario],
  );

  const valor = useMemo<ContextoAuth>(
    () => ({ usuario, cargando, estaAutenticado: Boolean(usuario), iniciarSesion, cerrarSesion, puede }),
    [usuario, cargando, iniciarSesion, cerrarSesion, puede],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

/** Acceso al contexto de autenticacion. */
export function useAuth(): ContextoAuth {
  const contexto = useContext(Contexto);
  if (!contexto) {
    throw new Error('useAuth debe usarse dentro de <ProveedorAuth>');
  }
  return contexto;
}

/** Traduce un error desconocido a un mensaje mostrable. */
export function mensajeDeError(error: unknown): string {
  return normalizarError(error).mensaje;
}

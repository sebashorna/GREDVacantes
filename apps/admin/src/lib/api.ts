import axios, { AxiosError, type AxiosInstance } from 'axios';
import { demoApiAdapter } from '@/lib/demo-api';

const MODO_CONSULTA_WEB = window.location.pathname === '/app/consulta';
const USAR_API_DEMO =
  import.meta.env.VITE_APP_DEMO === 'true' ||
  import.meta.env.VITE_APP_MOBILE === 'true' ||
  MODO_CONSULTA_WEB;

/**
 * Cliente HTTP del panel.
 *
 * Responsabilidades:
 *  - anadir el access token a cada peticion
 *  - renovar el token de forma transparente cuando caduca (una sola vez)
 *  - normalizar los errores de la API a un objeto con codigo y mensaje
 */
export const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
  ...(USAR_API_DEMO ? { adapter: demoApiAdapter } : {}),
});

/* ------------------------------------------------------------------ */
/* Manejo de tokens                                                     */
/* ------------------------------------------------------------------ */

const CLAVE_ACCESS = 'educa.accessToken';
const CLAVE_REFRESH = 'educa.refreshToken';

export const tokens = {
  get access(): string | null {
    return localStorage.getItem(CLAVE_ACCESS);
  },
  get refresh(): string | null {
    return localStorage.getItem(CLAVE_REFRESH);
  },
  set(access: string, refresh: string): void {
    localStorage.setItem(CLAVE_ACCESS, access);
    localStorage.setItem(CLAVE_REFRESH, refresh);
  },
  clear(): void {
    localStorage.removeItem(CLAVE_ACCESS);
    localStorage.removeItem(CLAVE_REFRESH);
  },
  get haySesion(): boolean {
    return Boolean(localStorage.getItem(CLAVE_ACCESS));
  },
};

/* ------------------------------------------------------------------ */
/* Errores normalizados                                                 */
/* ------------------------------------------------------------------ */

export interface ErrorApiDTO {
  codigo: string;
  mensaje: string;
  detalles?: { campo: string; mensaje: string }[];
  status: number;
}

/** Error de la API con la forma estandar del backend. */
export class ErrorApi extends Error {
  readonly codigo: string;
  readonly status: number;
  readonly detalles?: { campo: string; mensaje: string }[];

  constructor(datos: ErrorApiDTO) {
    super(datos.mensaje);
    this.name = 'ErrorApi';
    this.codigo = datos.codigo;
    this.mensaje = datos.mensaje;
    this.status = datos.status;
    this.detalles = datos.detalles;
  }

  readonly mensaje: string;
}

/** Convierte cualquier error de axios en un `ErrorApi`. */
export function normalizarError(error: unknown): ErrorApi {
  const axiosError = error as AxiosError<{
    error?: { codigo?: string; mensaje?: string; detalles?: { campo: string; mensaje: string }[] };
  }>;

  if (axiosError?.response?.data?.error) {
    const cuerpo = axiosError.response.data.error;
    return new ErrorApi({
      codigo: cuerpo.codigo ?? 'ERROR_DESCONOCIDO',
      mensaje: cuerpo.mensaje ?? 'Ocurrio un error inesperado',
      detalles: cuerpo.detalles,
      status: axiosError.response.status,
    });
  }

  if (axiosError?.code === 'ECONNABORTED') {
    return new ErrorApi({
      codigo: 'TIMEOUT',
      mensaje: 'La solicitud tardo demasiado. Intente nuevamente.',
      status: 408,
    });
  }

  if (axiosError?.response) {
    return new ErrorApi({
      codigo: 'ERROR_HTTP',
      mensaje: `Error ${axiosError.response.status} al comunicarse con el servidor`,
      status: axiosError.response.status,
    });
  }

  return new ErrorApi({
    codigo: 'SIN_CONEXION',
    mensaje: 'No se pudo conectar con el servidor. Verifique su conexion.',
    status: 0,
  });
}

/* ------------------------------------------------------------------ */
/* Interceptores                                                       */
/* ------------------------------------------------------------------ */

api.interceptors.request.use((config) => {
  const token = tokens.access;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Refresco del token.
 *
 * Si varias peticiones fallan por 401 a la vez, solo la primera dispara el
 * refresh; las demas esperan a esa promesa (evita invalidar el refresh token
 * rotativo varias veces).
 */
let refrescoEnCurso: Promise<string | null> | null = null;

async function refrescarToken(): Promise<string | null> {
  const refresh = tokens.refresh;
  if (!refresh) return null;

  try {
    const respuesta = await axios.post(
      `${import.meta.env.VITE_API_URL ?? '/api'}/auth/refresh`,
      { refreshToken: refresh },
      { headers: { 'Content-Type': 'application/json' } },
    );
    const { accessToken, refreshToken } = respuesta.data as {
      accessToken: string;
      refreshToken: string;
    };
    tokens.set(accessToken, refreshToken);
    return accessToken;
  } catch {
    tokens.clear();
    return null;
  }
}

api.interceptors.response.use(
  (respuesta) => respuesta,
  async (error: AxiosError) => {
    const original = error.config as (typeof error.config & { _reintento?: boolean }) | undefined;

    // Solo se reintenta una vez y solo en 401 por token caducado.
    if (error.response?.status === 401 && original && !original._reintento) {
      original._reintento = true;

      refrescoEnCurso ??= refrescarToken().finally(() => {
        refrescoEnCurso = null;
      });
      const nuevoToken = await refrescoEnCurso;

      if (nuevoToken) {
        original.headers.Authorization = `Bearer ${nuevoToken}`;
        return api.request(original);
      }
    }

    return Promise.reject(error);
  },
);

/* eslint-disable no-console */

/**
 * Logger minimo con niveles. En produccion se emite en JSON (una linea por
 * evento) para que un agregador de logs pueda indexarlo.
 */
type Nivel = 'info' | 'warn' | 'error' | 'debug';

const esProd = process.env.NODE_ENV === 'production';

function emitir(nivel: Nivel, mensaje: string, extra?: Record<string, unknown>): void {
  if (nivel === 'debug' && !esProd) {
    console.debug(`[debug] ${mensaje}`, extra ?? '');
    return;
  }
  if (esProd) {
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        nivel,
        mensaje,
        ...(extra ?? {}),
      }),
    );
    return;
  }
  const metodo = nivel === 'error' ? console.error : nivel === 'warn' ? console.warn : console.log;
  metodo(`[${nivel}] ${mensaje}`, extra ?? '');
}

export const logger = {
  info: (mensaje: string, extra?: Record<string, unknown>) => emitir('info', mensaje, extra),
  warn: (mensaje: string, extra?: Record<string, unknown>) => emitir('warn', mensaje, extra),
  error: (mensaje: string, extra?: Record<string, unknown>) => emitir('error', mensaje, extra),
  debug: (mensaje: string, extra?: Record<string, unknown>) => emitir('debug', mensaje, extra),
};

/**
 * Error de aplicacion con codigo HTTP y clave estable para el cliente.
 *
 * La API responde siempre con la misma forma de error:
 *   { error: { codigo, mensaje, detalles? } }
 */
export class AppError extends Error {
  readonly status: number;
  readonly codigo: string;
  readonly detalles?: unknown;

  constructor(status: number, codigo: string, mensaje: string, detalles?: unknown) {
    super(mensaje);
    this.name = 'AppError';
    this.status = status;
    this.codigo = codigo;
    this.detalles = detalles;
  }

  static badRequest(mensaje: string, detalles?: unknown): AppError {
    return new AppError(400, 'BAD_REQUEST', mensaje, detalles);
  }

  static noAutorizado(mensaje = 'No autenticado'): AppError {
    return new AppError(401, 'NO_AUTORIZADO', mensaje);
  }

  static prohibido(mensaje = 'No tiene permisos para esta operacion'): AppError {
    return new AppError(403, 'SIN_PERMISOS', mensaje);
  }

  static noEncontrado(recurso = 'Recurso'): AppError {
    return new AppError(404, 'NO_ENCONTRADO', `${recurso} no encontrado`);
  }

  static conflicto(mensaje: string, detalles?: unknown): AppError {
    return new AppError(409, 'CONFLICTO', mensaje, detalles);
  }

  static interno(mensaje = 'Error interno del servidor'): AppError {
    return new AppError(500, 'ERROR_INTERNO', mensaje);
  }
}

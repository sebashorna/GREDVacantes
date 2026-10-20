import { Router, type Request, type Response, type NextFunction } from 'express';
import type { Rol } from '@prisma/client';

import { requiereAuth, requiereRol } from './auth.js';
import { auditar } from './auditoria.js';
import { validar } from './validar.js';
import type { ZodTypeAny } from 'zod';

/**
 * Firma minima que un servicio debe cumplir para usar `crudRouter`.
 *
 * `listar` recibe un objeto de filtros: cada modulo define su propia forma
 * (con `page`/`limit` obligatorios), por eso el tipo es generico.
 */
export interface ServicioCrud<TBody = unknown, TUpdate = unknown, TFiltros = unknown> {
  listar(filtros: TFiltros): Promise<unknown>;
  obtenerPorId(id: number): Promise<unknown>;
  crear(datos: TBody): Promise<unknown>;
  actualizar(id: number, datos: TUpdate): Promise<unknown>;
  eliminar(id: number): Promise<unknown>;
}

export interface CrudOpciones<TBody, TUpdate, TFiltros, TId = number> {
  /** Nombre de la entidad, usado en la auditoria y los mensajes. */
  entidad: string;
  /** Schema Zod del cuerpo de alta. */
  schemaCrear: ZodTypeAny;
  /** Schema Zod del cuerpo de modificacion (parcial). */
  schemaActualizar: ZodTypeAny;
  /**
   * Servicio con las operaciones CRUD.
   *
   * Los metodos reciben `any` a proposito: cada modulo declara sus propios
   * tipos en las funciones del servicio, y aqui solo hace falta que la
   * forma (firma) coincida.
   */
  servicio: {
    listar(filtros: TFiltros): Promise<unknown>;
    obtenerPorId(id: TId): Promise<unknown>;
    crear(datos: TBody): Promise<unknown>;
    actualizar(id: TId, datos: TUpdate): Promise<unknown>;
    eliminar(id: TId): Promise<unknown>;
  };
  /** Roles autorizados a escribir. Por defecto, solo ADMIN_GRED. */
  rolesEscritura?: Rol[];
  /** Construye los filtros de listado a partir de la query cruda. */
  filtrosListado: (req: Request) => TFiltros;
  /**
   * Convierte el parametro de ruta en el id que espera el servicio.
   * Por defecto convierte a numero (la mayoria de las entidades).
   */
  parsearId?: (crudo: string) => TId;
}

/**
 * Fabrica de routers CRUD.
 *
 * Todos los modulos comparten la misma forma: listar con filtros, ver uno,
 * crear, actualizar y eliminar. Centralizarlo evita repetir 60 lineas por
 * modulo y mantiene el mismo comportamiento de auth, roles y auditoria.
 */
export function crudRouter<TBody, TUpdate, TFiltros, TId = number>(
  opciones: CrudOpciones<TBody, TUpdate, TFiltros, TId>,
): Router {
  const router = Router();
  const roles = opciones.rolesEscritura ?? ['ADMIN_GRED'];
  const parsearId = opciones.parsearId ?? ((crudo: string) => Number(crudo) as unknown as TId);

  router.use(requiereAuth);

  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filtros = opciones.filtrosListado(req);
      const resultado = await opciones.servicio.listar(filtros);
      res.json(resultado);
    } catch (error) {
      next(error);
    }
  });

  router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await opciones.servicio.obtenerPorId(parsearId(req.params.id ?? ''));
      res.json(data);
    } catch (error) {
      next(error);
    }
  });

  router.post(
    '/',
    requiereRol(...roles),
    validar(opciones.schemaCrear),
    auditar({ accion: 'CREAR', entidad: opciones.entidad }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await opciones.servicio.crear(req.body as TBody);
        res.status(201).json(data);
      } catch (error) {
        next(error);
      }
    },
  );

  router.put(
    '/:id',
    requiereRol(...roles),
    validar(opciones.schemaActualizar),
    auditar({ accion: 'ACTUALIZAR', entidad: opciones.entidad }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await opciones.servicio.actualizar(
          parsearId(req.params.id ?? ''),
          req.body as TUpdate,
        );
        res.json(data);
      } catch (error) {
        next(error);
      }
    },
  );

  router.delete(
    '/:id',
    requiereRol(...roles),
    auditar({ accion: 'ELIMINAR', entidad: opciones.entidad }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await opciones.servicio.eliminar(parsearId(req.params.id ?? ''));
        res.json(data);
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}

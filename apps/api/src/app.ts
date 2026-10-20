import path from 'node:path';
import { fileURLToPath } from 'node:url';

import compression from 'compression';
import cors from 'cors';
import express, { type Express } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import multer from 'multer';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import { config } from './config/env.js';
import { errorHandler, notFoundHandler } from './common/error-handler.js';
import { logger } from './common/logger.js';

import authRoutes from './modules/auth/auth.routes.js';
import catalogosRoutes from './modules/catalogos/catalogos.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import institucionesRoutes from './modules/instituciones/instituciones.routes.js';
import vacantesRoutes from './modules/vacantes/vacantes.routes.js';
import plazasRoutes from './modules/plazas/plazas.routes.js';
import convocatoriasRoutes from './modules/convocatorias/convocatorias.routes.js';
import localesRoutes from './modules/locales/locales.routes.js';
import alertasRoutes from './modules/alertas/alertas.routes.js';
import comunicadosRoutes from './modules/comunicados/comunicados.routes.js';
import importacionRoutes from './modules/importacion/importacion.routes.js';
import publicRoutes from './modules/public/public.routes.js';
import { auditar } from './common/auditoria.js';
import { prisma } from './config/prisma.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function crearApp(): Express {
  const app = express();

  // Confianza en el proxy inverso: permite que req.ip refleje la IP real
  // cuando la API corre detras de nginx (ver Dockerfiles).
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(
    helmet({
      // La API sirve JSON, no HTML: la CSP por defecto de helmet no aporta
      // aqui y complica Swagger UI.
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.use(
    cors({
      origin: (origen, callback) => {
        // Sin origen = peticiones server-to-server o curl: se permiten.
        if (!origen) return callback(null, true);
        if (config.CORS_ORIGINS.includes(origen)) return callback(null, true);
        return callback(new Error(`Origen no permitido por CORS: ${origen}`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    }),
  );

  app.use(compression());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  if (!config.isProd) {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  // Carga de archivos (importacion masiva). El limite de tamano se valida
  // tambien en el controlador, para dar un mensaje de negocio claro.
  const almacenamiento = multer.memoryStorage();
  app.use(
    multer({
      storage: almacenamiento,
      limits: { fileSize: 10 * 1024 * 1024 },
    }).fields([{ name: 'archivo', maxCount: 1 }]),
  );

  // Limite global de peticiones: evita abuso accidental.
  app.use(
    '/api',
    rateLimit({
      windowMs: 60 * 1000,
      limit: 300,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
    }),
  );

  /* ------------------- Documentacion Swagger ------------------- */

  const especificacion = swaggerJsdoc({
    definition: {
      openapi: '3.0.3',
      info: {
        title: 'API Educa Lambayeque',
        version: '1.0.0',
        description:
          'API del panel administrativo de la Gerencia Regional de Educacion de Lambayeque. ' +
          'Documentacion provisional: los datos de ejemplo son ficticios.',
      },
      servers: [
        { url: `http://localhost:${config.PORT}`, description: 'Local' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
    },
    apis: [path.join(__dirname, '**/*.routes.{ts,js}')],
  });

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(especificacion, {
    customSiteTitle: 'API Educa Lambayeque',
  }));
  app.get('/openapi.json', (_req, res) => res.json(especificacion));

  /* ----------------------- Salud y estado ---------------------- */

  app.get('/health', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ estado: 'ok', baseDatos: 'conectada', version: '1.0.0' });
    } catch {
      res.status(503).json({ estado: 'degradado', baseDatos: 'sin conexion' });
    }
  });

  /* --------------------------- Rutas ---------------------------- */

  app.use('/api/auth', authRoutes);
  app.use('/api/catalogos', catalogosRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/instituciones', institucionesRoutes);
  app.use('/api/vacantes', vacantesRoutes);
  app.use('/api/plazas', plazasRoutes);
  app.use('/api/convocatorias', convocatoriasRoutes);
  app.use('/api/locales', localesRoutes);
  app.use('/api/alertas', alertasRoutes);
  app.use('/api/comunicados', comunicadosRoutes);
  app.use('/api/importacion', importacionRoutes);
  app.use('/api/public', publicRoutes);

  /* ----------------------- Manejo de errores -------------------- */

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

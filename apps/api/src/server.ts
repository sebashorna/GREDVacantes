import { crearApp } from './app.js';
import { config } from './config/env.js';
import { logger } from './common/logger.js';
import { prisma } from './config/prisma.js';

const app = crearApp();

const servidor = app.listen(config.PORT, () => {
  logger.info(`API Educa Lambayeque escuchando en http://localhost:${config.PORT}`, {
    entorno: config.NODE_ENV,
    docs: `http://localhost:${config.PORT}/docs`,
  });
});

/** Cierre ordenado: se deja de aceptar conexiones y se cierra el pool. */
async function cerrar(senal: string): Promise<void> {
  logger.info(`Senal ${senal} recibida, cerrando la API...`);
  servidor.close(async () => {
    await prisma.$disconnect();
    logger.info('API cerrada correctamente');
    process.exit(0);
  });
  // Si el cierre no se completa en 10 s, se fuerza la salida.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => void cerrar('SIGINT'));
process.on('SIGTERM', () => void cerrar('SIGTERM'));

process.on('unhandledRejection', (razon) => {
  logger.error('Promesa rechazada sin manejar', {
    razon: razon instanceof Error ? razon.message : String(razon),
  });
});

process.on('uncaughtException', (error) => {
  logger.error('Excepcion no capturada', { mensaje: error.message, stack: error.stack });
  process.exit(1);
});

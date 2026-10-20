import { PrismaClient } from '@prisma/client';

import { config } from '../config/env.js';

/**
 * Cliente Prisma singleton.
 *
 * En desarrollo con `tsx watch` el modulo se re-evalua en cada cambio, por lo
 * que se guarda la instancia en `globalThis` para no abrir un pool de
 * conexiones nuevo en cada recarga.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: config.isProd ? ['error'] : ['warn', 'error'],
  });

if (!config.isProd) {
  globalForPrisma.prisma = prisma;
}

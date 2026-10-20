/**
 * @educa/shared
 *
 * Contrato unico entre la API y el panel administrativo:
 *  - enums del dominio (valores identicos a los del schema Prisma)
 *  - schemas Zod de validacion (reutilizados en API y en formularios)
 *
 * Los enums deben coincidir EXACTAMENTE con los `enum` de
 * `apps/api/prisma/schema.prisma`.
 */
export * from './enums.js';
export * from './schemas.js';

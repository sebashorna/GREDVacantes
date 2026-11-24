import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const vacanteMatricula = { updateMany: vi.fn(), findUnique: vi.fn() };
  return { vacanteMatricula, transaction: vi.fn() };
});

vi.mock('../../config/prisma.js', () => ({
  prisma: {
    $transaction: mocks.transaction,
  },
}));

import { actualizar } from './vacantes.service.js';

describe('actualización de cupos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation((fn) => fn({ vacanteMatricula: mocks.vacanteMatricula }));
    mocks.vacanteMatricula.findUnique.mockResolvedValue({ id: 1, cupoTotal: 5, cupoDisponibles: 3 });
    mocks.vacanteMatricula.updateMany.mockResolvedValue({ count: 1 });
  });

  it('rechaza una actualización con ambos cupos incompatibles', async () => {
    await expect(actualizar(1, { cupoTotal: 5, cupoDisponibles: 6 }))
      .rejects.toThrow('Los cupos disponibles no pueden superar el cupo total');
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it.each([
    [{ cupoDisponibles: 6 }, { cupoTotal: { gte: 6 } }],
    [{ cupoTotal: 2 }, { cupoDisponibles: { lte: 2 } }],
  ])('condiciona atómicamente la actualización parcial %#', async (datos, condicion) => {
    mocks.vacanteMatricula.updateMany.mockResolvedValue({ count: 0 });
    await expect(actualizar(1, datos)).rejects.toThrow('Los cupos disponibles no pueden superar el cupo total');
    expect(mocks.vacanteMatricula.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1, ...condicion }, data: datos }),
    );
  });

  it('permite cambiar ambos cupos de forma válida', async () => {
    await expect(actualizar(1, { cupoTotal: 7, cupoDisponibles: 6 })).resolves.toMatchObject({ id: 1 });
    expect(mocks.vacanteMatricula.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 }, data: { cupoTotal: 7, cupoDisponibles: 6 } }),
    );
  });

  it('informa si la vacante no existe', async () => {
    mocks.vacanteMatricula.updateMany.mockResolvedValue({ count: 0 });
    mocks.vacanteMatricula.findUnique.mockResolvedValue(null);
    await expect(actualizar(1, { cupoTotal: 2 })).rejects.toThrow('Vacante no encontrado');
  });
});

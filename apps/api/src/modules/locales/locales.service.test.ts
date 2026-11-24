import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  findUnique: vi.fn(),
}));
vi.mock('../../config/prisma.js', () => ({
  prisma: { localEscolar: mocks },
}));

import { actualizar, crear } from './locales.service.js';

describe('fotos de locales escolares', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findUnique.mockResolvedValue({ id: 1 });
  });

  it('guarda las fotos al crear un local', async () => {
    await crear({
      ieId: 1, codigoLocal: '123456', estado: 'OPERATIVO_REGULAR', aulasOperativas: 1,
      aulasTotales: 2, agua: 'AGUA_24H', luz: true, fibra: false, fotos: ['/uploads/foto.png'],
    });
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ fotos: ['/uploads/foto.png'] }),
    }));
  });

  it('actualiza o retira fotos sin borrarlas al editar otros campos', async () => {
    await actualizar(1, { fotos: [] });
    expect(mocks.update).toHaveBeenLastCalledWith(expect.objectContaining({ data: { fotos: [] } }));
    await actualizar(1, { aulasOperativas: 2 });
    expect(mocks.update).toHaveBeenLastCalledWith(expect.objectContaining({ data: { aulasOperativas: 2 } }));
  });
});

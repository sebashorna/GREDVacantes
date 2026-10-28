import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { Router } from 'express';
import multer from 'multer';

import { requiereAuth, requiereRol } from '../../common/auth.js';
import { auditar } from '../../common/auditoria.js';
import { AppError } from '../../common/errors.js';
import { config } from '../../config/env.js';

const router = Router();
const cargarArchivo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
}).single('archivo');

type TipoArchivo = 'imagen' | 'pdf';

function extensionSegura(buffer: Buffer): string | null {
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return 'jpg';
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  if (
    buffer.toString('ascii', 4, 8) === 'ftyp' &&
    /avif|avis/.test(buffer.toString('ascii', 8, 32))
  ) return 'avif';
  if (buffer.toString('ascii', 0, 5) === '%PDF-') return 'pdf';
  return null;
}

router.post(
  '/',
  requiereAuth,
  requiereRol('ADMIN_GRED', 'EDITOR_UGEL'),
  auditar({ accion: 'SUBIR', entidad: 'archivo' }),
  cargarArchivo,
  async (req, res, next) => {
    try {
      const tipo = req.body?.tipo as TipoArchivo | undefined;
      const archivo = req.file;
      if (!archivo) throw AppError.badRequest('Selecciona un archivo para cargar.');
      if (tipo !== 'imagen' && tipo !== 'pdf') {
        throw AppError.badRequest('El tipo de archivo debe ser imagen o pdf.');
      }

      const extension = extensionSegura(archivo.buffer);
      const extensionesImagen = ['jpg', 'png', 'webp', 'avif'];
      if (
        !extension ||
        (tipo === 'imagen' && !extensionesImagen.includes(extension)) ||
        (tipo === 'pdf' && extension !== 'pdf')
      ) {
        throw AppError.badRequest(
          tipo === 'imagen'
            ? 'El archivo no es una imagen PNG, JPG, WebP o AVIF válida.'
            : 'El archivo no es un PDF válido.',
        );
      }

      const nombre = `${randomUUID()}.${extension}`;
      const directorio = path.resolve(config.DIRECTORIO_ARCHIVOS);
      await mkdir(directorio, { recursive: true });
      await writeFile(path.join(directorio, nombre), archivo.buffer, { flag: 'wx' });

      res.status(201).json({
        url: `${req.protocol}://${req.get('host')}/uploads/${nombre}`,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;

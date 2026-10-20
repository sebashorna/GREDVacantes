import { useState } from 'react';
import { z } from 'zod';
import { usePaginacion } from '@/hooks/usePaginacion';
import { api } from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { mensajeDeError, useAuth } from '@/features/auth/auth-context';
import { Boton } from '@/components/ui/Boton';
import { Badge, type TonoBadge } from '@/components/ui/Badge';
import { EncabezadoPagina } from '@/components/EncabezadoPagina';
import { CampoSelect, CampoTexto, CampoArea } from '@/components/ui/Campo';
import { Confirmacion } from '@/components/ui/Confirmacion';
import { Modal } from '@/components/ui/Modal';
import { Tabla, type Columna } from '@/components/ui/Tabla';

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
  ABIERTA: 'Abierta', EN_ATENCION: 'En atenciÃ³n', RESUELTA: 'Resuelta', DESCARTADA: 'Descartada',
/* Etiquetas y tonos de la UI */
const ETIQUETAS_ESTADO_ALERTA: Record<string, string> = {
  ABIERTA: 'exito', EN_ATENCION: 'info', RESUELTA: 'exito', DESCARTADA: 'neutro',

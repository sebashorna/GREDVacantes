-- CreateEnum
CREATE TYPE "NivelEducativo" AS ENUM ('INICIAL_JARDIN', 'PRIMARIA', 'SECUNDARIA', 'EBE');

-- CreateEnum
CREATE TYPE "Turno" AS ENUM ('MANANA', 'TARDE', 'MANANA_Y_TARDE', 'COMPLETO', 'CONTINUO_DIURNO');

-- CreateEnum
CREATE TYPE "Zona" AS ENUM ('URBANA', 'RURAL_1', 'RURAL_2', 'RURAL_3_EIB');

-- CreateEnum
CREATE TYPE "Jornada" AS ENUM ('JORNADA_30', 'JORNADA_35', 'JORNADA_40', 'JORNADA_25');

-- CreateEnum
CREATE TYPE "EstadoVacante" AS ENUM ('LIBRE', 'COMPLETO', 'LISTA_ESPERA', 'CERRADO');

-- CreateEnum
CREATE TYPE "TipoPlaza" AS ENUM ('ORGANICA', 'EVENTUAL_CUADRO', 'REEMPLAZO_LICENCIA', 'POR_EVALUACION');

-- CreateEnum
CREATE TYPE "EstadoPlaza" AS ENUM ('ACTIVA', 'ADJUDICADA', 'CERRADA', 'CONVOCADA');

-- CreateEnum
CREATE TYPE "FaseConvocatoria" AS ENUM ('INSCRIPCION', 'ADJUDICACION', 'CONTRATACION', 'FINALIZADA');

-- CreateEnum
CREATE TYPE "EstadoLocal" AS ENUM ('OPTIMO', 'MANTENIMIENTO_PREVENTIVO', 'EN_REFRACCION', 'AULAS_TEMPORALES', 'ATENCION_PRIORITARIA', 'OPERATIVO_REGULAR');

-- CreateEnum
CREATE TYPE "EstadoServicio" AS ENUM ('AGUA_24H', 'CISTERNA', 'RED_OK', 'NO_DISPONIBLE');

-- CreateEnum
CREATE TYPE "EstadoAlerta" AS ENUM ('ABIERTA', 'EN_ATENCION', 'RESUELTA', 'DESCARTADA');

-- CreateEnum
CREATE TYPE "TipoAlerta" AS ENUM ('FILTRACION', 'AULA_DETERIORADA', 'FALTA_AGUA', 'FALTA_LUZ', 'OTRO');

-- CreateEnum
CREATE TYPE "CategoriaComunicado" AS ENUM ('MATERIALES', 'CAPACITACION', 'CONVOCATORIA', 'NORMATIVA', 'SERVICIO');

-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN_GRED', 'EDITOR_UGEL', 'CONSULTOR');

-- CreateTable
CREATE TABLE "ugel" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ugel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provincia" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provincia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distrito" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "provincia_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "distrito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "institucion_educativa" (
    "id" SERIAL NOT NULL,
    "codigo_modular" VARCHAR(10) NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "nivel" "NivelEducativo" NOT NULL,
    "turno" "Turno" NOT NULL,
    "zona" "Zona" NOT NULL,
    "ugel_id" INTEGER NOT NULL,
    "provincia_id" INTEGER NOT NULL,
    "distrito_id" INTEGER NOT NULL,
    "telefono" VARCHAR(20),
    "whatsapp" VARCHAR(20),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "institucion_educativa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vacante_matricula" (
    "id" SERIAL NOT NULL,
    "ie_id" INTEGER NOT NULL,
    "nivel" "NivelEducativo" NOT NULL,
    "turno" "Turno" NOT NULL,
    "cupo_total" INTEGER NOT NULL,
    "cupo_disponibles" INTEGER NOT NULL,
    "estado" "EstadoVacante" NOT NULL DEFAULT 'LIBRE',
    "fecha_limite" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vacante_matricula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convocatoria" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "numero_rd" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE NOT NULL,
    "fase" "FaseConvocatoria" NOT NULL DEFAULT 'INSCRIPCION',
    "pdf_meritos_url" VARCHAR(500),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "convocatoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plaza_docente" (
    "id" SERIAL NOT NULL,
    "ie_id" INTEGER NOT NULL,
    "convocatoria_id" INTEGER NOT NULL,
    "cargo" VARCHAR(150) NOT NULL,
    "area" VARCHAR(150) NOT NULL,
    "nivel" "NivelEducativo" NOT NULL,
    "jornada" "Jornada" NOT NULL,
    "zona" "Zona" NOT NULL,
    "turno" "Turno" NOT NULL,
    "tipo" "TipoPlaza" NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "estado" "EstadoPlaza" NOT NULL DEFAULT 'ACTIVA',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plaza_docente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "local_escolar" (
    "id" SERIAL NOT NULL,
    "ie_id" INTEGER NOT NULL,
    "codigo_local" VARCHAR(10) NOT NULL,
    "estado" "EstadoLocal" NOT NULL,
    "aulas_operativas" INTEGER NOT NULL,
    "aulas_totales" INTEGER NOT NULL,
    "agua" "EstadoServicio" NOT NULL DEFAULT 'NO_DISPONIBLE',
    "luz" BOOLEAN NOT NULL DEFAULT false,
    "fibra" BOOLEAN NOT NULL DEFAULT false,
    "capacidad_alumnos" INTEGER,
    "avance_obras" DECIMAL(5,2),
    "presupuesto" DECIMAL(12,2),
    "ficha_edan_url" VARCHAR(500),
    "ultima_inspeccion" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "local_escolar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerta_ciudadana" (
    "id" SERIAL NOT NULL,
    "local_escolar_id" INTEGER NOT NULL,
    "ie_id" INTEGER NOT NULL,
    "tipo" "TipoAlerta" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fotos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reportado_por" VARCHAR(150) NOT NULL,
    "telefono_reporte" VARCHAR(20),
    "estado" "EstadoAlerta" NOT NULL DEFAULT 'ABIERTA',
    "observacion" TEXT,
    "resuelto_en" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alerta_ciudadana_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comunicado" (
    "id" TEXT NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "categoria" "CategoriaComunicado" NOT NULL,
    "resumen" VARCHAR(500) NOT NULL,
    "contenido" TEXT,
    "fecha" DATE NOT NULL,
    "imagen_url" VARCHAR(500),
    "publicado" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comunicado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "email" VARCHAR(180) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'CONSULTOR',
    "ugel_id" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_acceso" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_token" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expira_en" TIMESTAMP(3) NOT NULL,
    "revocado" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER,
    "accion" VARCHAR(60) NOT NULL,
    "entidad" VARCHAR(60) NOT NULL,
    "entidad_id" VARCHAR(60),
    "detalle" TEXT,
    "ip" VARCHAR(60),
    "user_agent" VARCHAR(300),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ugel_codigo_key" ON "ugel"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "provincia_codigo_key" ON "provincia"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "distrito_codigo_key" ON "distrito"("codigo");

-- CreateIndex
CREATE INDEX "distrito_provincia_id_idx" ON "distrito"("provincia_id");

-- CreateIndex
CREATE UNIQUE INDEX "institucion_educativa_codigo_modular_key" ON "institucion_educativa"("codigo_modular");

-- CreateIndex
CREATE INDEX "institucion_educativa_nivel_idx" ON "institucion_educativa"("nivel");

-- CreateIndex
CREATE INDEX "institucion_educativa_ugel_id_idx" ON "institucion_educativa"("ugel_id");

-- CreateIndex
CREATE INDEX "institucion_educativa_distrito_id_idx" ON "institucion_educativa"("distrito_id");

-- CreateIndex
CREATE INDEX "institucion_educativa_nombre_idx" ON "institucion_educativa"("nombre");

-- CreateIndex
CREATE INDEX "vacante_matricula_ie_id_idx" ON "vacante_matricula"("ie_id");

-- CreateIndex
CREATE INDEX "vacante_matricula_nivel_idx" ON "vacante_matricula"("nivel");

-- CreateIndex
CREATE INDEX "vacante_matricula_estado_idx" ON "vacante_matricula"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "convocatoria_numero_rd_key" ON "convocatoria"("numero_rd");

-- CreateIndex
CREATE INDEX "convocatoria_fase_idx" ON "convocatoria"("fase");

-- CreateIndex
CREATE INDEX "plaza_docente_ie_id_idx" ON "plaza_docente"("ie_id");

-- CreateIndex
CREATE INDEX "plaza_docente_convocatoria_id_idx" ON "plaza_docente"("convocatoria_id");

-- CreateIndex
CREATE INDEX "plaza_docente_tipo_idx" ON "plaza_docente"("tipo");

-- CreateIndex
CREATE INDEX "plaza_docente_nivel_idx" ON "plaza_docente"("nivel");

-- CreateIndex
CREATE INDEX "plaza_docente_estado_idx" ON "plaza_docente"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "local_escolar_codigo_local_key" ON "local_escolar"("codigo_local");

-- CreateIndex
CREATE INDEX "local_escolar_ie_id_idx" ON "local_escolar"("ie_id");

-- CreateIndex
CREATE INDEX "local_escolar_estado_idx" ON "local_escolar"("estado");

-- CreateIndex
CREATE INDEX "alerta_ciudadana_estado_idx" ON "alerta_ciudadana"("estado");

-- CreateIndex
CREATE INDEX "alerta_ciudadana_tipo_idx" ON "alerta_ciudadana"("tipo");

-- CreateIndex
CREATE INDEX "alerta_ciudadana_ie_id_idx" ON "alerta_ciudadana"("ie_id");

-- CreateIndex
CREATE INDEX "comunicado_categoria_idx" ON "comunicado"("categoria");

-- CreateIndex
CREATE INDEX "comunicado_publicado_idx" ON "comunicado"("publicado");

-- CreateIndex
CREATE INDEX "comunicado_fecha_idx" ON "comunicado"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE INDEX "usuario_rol_idx" ON "usuario"("rol");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_token_token_hash_key" ON "refresh_token"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_token_usuario_id_idx" ON "refresh_token"("usuario_id");

-- CreateIndex
CREATE INDEX "refresh_token_expira_en_idx" ON "refresh_token"("expira_en");

-- CreateIndex
CREATE INDEX "auditoria_usuario_id_idx" ON "auditoria"("usuario_id");

-- CreateIndex
CREATE INDEX "auditoria_entidad_idx" ON "auditoria"("entidad");

-- CreateIndex
CREATE INDEX "auditoria_created_at_idx" ON "auditoria"("created_at");

-- AddForeignKey
ALTER TABLE "distrito" ADD CONSTRAINT "distrito_provincia_id_fkey" FOREIGN KEY ("provincia_id") REFERENCES "provincia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "institucion_educativa" ADD CONSTRAINT "institucion_educativa_ugel_id_fkey" FOREIGN KEY ("ugel_id") REFERENCES "ugel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "institucion_educativa" ADD CONSTRAINT "institucion_educativa_provincia_id_fkey" FOREIGN KEY ("provincia_id") REFERENCES "provincia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "institucion_educativa" ADD CONSTRAINT "institucion_educativa_distrito_id_fkey" FOREIGN KEY ("distrito_id") REFERENCES "distrito"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacante_matricula" ADD CONSTRAINT "vacante_matricula_ie_id_fkey" FOREIGN KEY ("ie_id") REFERENCES "institucion_educativa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plaza_docente" ADD CONSTRAINT "plaza_docente_ie_id_fkey" FOREIGN KEY ("ie_id") REFERENCES "institucion_educativa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plaza_docente" ADD CONSTRAINT "plaza_docente_convocatoria_id_fkey" FOREIGN KEY ("convocatoria_id") REFERENCES "convocatoria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "local_escolar" ADD CONSTRAINT "local_escolar_ie_id_fkey" FOREIGN KEY ("ie_id") REFERENCES "institucion_educativa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerta_ciudadana" ADD CONSTRAINT "alerta_ciudadana_local_escolar_id_fkey" FOREIGN KEY ("local_escolar_id") REFERENCES "local_escolar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerta_ciudadana" ADD CONSTRAINT "alerta_ciudadana_ie_id_fkey" FOREIGN KEY ("ie_id") REFERENCES "institucion_educativa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_ugel_id_fkey" FOREIGN KEY ("ugel_id") REFERENCES "ugel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

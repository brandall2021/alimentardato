-- AlterEnum
ALTER TYPE "TipoDocumento" ADD VALUE 'DNT';
ALTER TYPE "TipoDocumento" ADD VALUE 'CI';
ALTER TYPE "TipoDocumento" ADD VALUE 'CUIT_CUIL';
ALTER TYPE "TipoDocumento" ADD VALUE 'CM';
ALTER TYPE "TipoDocumento" ADD VALUE 'CD';
ALTER TYPE "TipoDocumento" ADD VALUE 'CC';
ALTER TYPE "TipoDocumento" ADD VALUE 'CDI';

-- AlterTable
ALTER TABLE "Alumno" ADD COLUMN "sexo" INTEGER,
ADD COLUMN "cuit" TEXT;

-- CreateTableMateria
CREATE TABLE "Materia" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cargaHoraria" INTEGER,
    "obligatoriedad" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Materia_pkey" PRIMARY KEY ("id")
);

-- CreateTableInscripcion
CREATE TABLE "Inscripcion" (
    "id" TEXT NOT NULL,
    "alumnoId" TEXT NOT NULL,
    "tipoDocumento" "TipoDocumento" NOT NULL,
    "numeroDocumento" TEXT NOT NULL,
    "cuit" TEXT,
    "planCodigo" INTEGER NOT NULL,
    "sedeCodigo" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "turno" INTEGER,
    "regularidad" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inscripcion_pkey" PRIMARY KEY ("id")
);

-- CreateTableExamen
CREATE TABLE "Examen" (
    "id" TEXT NOT NULL,
    "alumnoId" TEXT NOT NULL,
    "tipoDocumento" "TipoDocumento" NOT NULL,
    "numeroDocumento" TEXT NOT NULL,
    "cuit" TEXT,
    "planCodigo" INTEGER NOT NULL,
    "sedeCodigo" INTEGER NOT NULL,
    "fechaExamen" TIMESTAMP(3) NOT NULL,
    "turno" INTEGER,
    "materiaCodigo" TEXT NOT NULL,
    "materiaNombre" TEXT NOT NULL,
    "cargaHoraria" INTEGER,
    "aprobadas" INTEGER,
    "totalMaterias" INTEGER,
    "periodo" TEXT,
    "actaCodigo" TEXT,
    "numeroActa" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Examen_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Materia_codigo_key" ON "Materia"("codigo");

-- CreateIndex
CREATE INDEX "Alumno_cuit_idx" ON "Alumno"("cuit");

-- CreateIndex
CREATE UNIQUE INDEX "Inscripcion_alumnoId_planCodigo_anio_turno_key" ON "Inscripcion"("alumnoId", "planCodigo", "anio", "turno");

-- CreateIndex
CREATE INDEX "Inscripcion_alumnoId_idx" ON "Inscripcion"("alumnoId");

-- CreateIndex
CREATE INDEX "Inscripcion_planCodigo_idx" ON "Inscripcion"("planCodigo");

-- CreateIndex
CREATE INDEX "Inscripcion_anio_idx" ON "Inscripcion"("anio");

-- CreateIndex
CREATE INDEX "Inscripcion_numeroDocumento_idx" ON "Inscripcion"("numeroDocumento");

-- CreateIndex
CREATE UNIQUE INDEX "Examen_alumnoId_fechaExamen_materiaCodigo_key" ON "Examen"("alumnoId", "fechaExamen", "materiaCodigo");

-- CreateIndex
CREATE INDEX "Examen_alumnoId_idx" ON "Examen"("alumnoId");

-- CreateIndex
CREATE INDEX "Examen_materiaCodigo_idx" ON "Examen"("materiaCodigo");

-- CreateIndex
CREATE INDEX "Examen_numeroDocumento_idx" ON "Examen"("numeroDocumento");

-- CreateIndex
CREATE INDEX "Examen_periodo_idx" ON "Examen"("periodo");

-- CreateIndex
CREATE INDEX "Examen_fechaExamen_idx" ON "Examen"("fechaExamen");

-- AddForeignKey
ALTER TABLE "Inscripcion" ADD CONSTRAINT "Inscripcion_alumnoId_fkey" FOREIGN KEY ("alumnoId") REFERENCES "Alumno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Examen" ADD CONSTRAINT "Examen_alumnoId_fkey" FOREIGN KEY ("alumnoId") REFERENCES "Alumno"("id") ON DELETE CASCADE ON UPDATE CASCADE;
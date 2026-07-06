-- CreateTable
CREATE TABLE "AraucanoRegistro" (
    "id" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "codigoTipoDocumento" INTEGER NOT NULL,
    "numeroDocumento" TEXT NOT NULL,
    "cuil" TEXT NOT NULL,
    "genero" INTEGER NOT NULL,
    "fechaNacimiento" TIMESTAMP(3) NOT NULL,
    "cueEscuelaOrigen" TEXT NOT NULL,
    "codigoHorasTrabajo" TEXT NOT NULL,
    "nivelInstruccionPadre" INTEGER NOT NULL,
    "nivelInstruccionMadre" INTEGER NOT NULL,
    "paisNacimiento" INTEGER NOT NULL,
    "paisDomicilioProcedencia" INTEGER NOT NULL,
    "fechaIngresoPais" TIMESTAMP(3),
    "paisExpedidorTitulo" INTEGER NOT NULL,
    "localidadProcedencia" INTEGER,
    "identidadGenero" INTEGER NOT NULL,
    "identidadGeneroTexto" TEXT,
    "puebloOriginario" INTEGER,
    "puebloOriginarioTexto" TEXT,
    "condicionDiscapacidad" TEXT NOT NULL DEFAULT 'N',
    "tieneCUD" TEXT NOT NULL DEFAULT 'N',
    "discapacidadAuditiva" TEXT NOT NULL DEFAULT 'N',
    "discapacidadVisual" TEXT NOT NULL DEFAULT 'N',
    "discapacidadMotora" TEXT NOT NULL DEFAULT 'N',
    "discapacidadPsicosocial" TEXT NOT NULL DEFAULT 'N',
    "otraSituacionDiscapacidad" TEXT NOT NULL DEFAULT 'N',
    "descripcionOtraDiscapacidad" TEXT,
    "importacionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AraucanoRegistro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AraucanoImportacion" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "filas" INTEGER NOT NULL,
    "importados" INTEGER NOT NULL DEFAULT 0,
    "errores" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AraucanoImportacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AraucanoRegistro_numeroDocumento_idx" ON "AraucanoRegistro"("numeroDocumento");

-- CreateIndex
CREATE INDEX "AraucanoRegistro_cuil_idx" ON "AraucanoRegistro"("cuil");

-- AddForeignKey
ALTER TABLE "AraucanoRegistro" ADD CONSTRAINT "AraucanoRegistro_importacionId_fkey" FOREIGN KEY ("importacionId") REFERENCES "AraucanoImportacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

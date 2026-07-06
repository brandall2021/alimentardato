-- CreateTable
CREATE TABLE "Archivo0Registro" (
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

    CONSTRAINT "Archivo0Registro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Archivo0Importacion" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "filas" INTEGER NOT NULL,
    "importados" INTEGER NOT NULL DEFAULT 0,
    "errores" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Archivo0Importacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Archivo1Registro" (
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

    CONSTRAINT "Archivo1Registro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Archivo1Importacion" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "filas" INTEGER NOT NULL,
    "importados" INTEGER NOT NULL DEFAULT 0,
    "errores" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Archivo1Importacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Archivo2Registro" (
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

    CONSTRAINT "Archivo2Registro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Archivo2Importacion" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "filas" INTEGER NOT NULL,
    "importados" INTEGER NOT NULL DEFAULT 0,
    "errores" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Archivo2Importacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Archivo3Registro" (
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

    CONSTRAINT "Archivo3Registro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Archivo3Importacion" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "filas" INTEGER NOT NULL,
    "importados" INTEGER NOT NULL DEFAULT 0,
    "errores" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Archivo3Importacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Archivo0Registro_numeroDocumento_idx" ON "Archivo0Registro"("numeroDocumento");

-- CreateIndex
CREATE INDEX "Archivo0Registro_cuil_idx" ON "Archivo0Registro"("cuil");

-- CreateIndex
CREATE INDEX "Archivo1Registro_numeroDocumento_idx" ON "Archivo1Registro"("numeroDocumento");

-- CreateIndex
CREATE INDEX "Archivo1Registro_cuil_idx" ON "Archivo1Registro"("cuil");

-- CreateIndex
CREATE INDEX "Archivo2Registro_numeroDocumento_idx" ON "Archivo2Registro"("numeroDocumento");

-- CreateIndex
CREATE INDEX "Archivo2Registro_cuil_idx" ON "Archivo2Registro"("cuil");

-- CreateIndex
CREATE INDEX "Archivo3Registro_numeroDocumento_idx" ON "Archivo3Registro"("numeroDocumento");

-- CreateIndex
CREATE INDEX "Archivo3Registro_cuil_idx" ON "Archivo3Registro"("cuil");

-- AddForeignKey
ALTER TABLE "Archivo0Registro" ADD CONSTRAINT "Archivo0Registro_importacionId_fkey" FOREIGN KEY ("importacionId") REFERENCES "Archivo0Importacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Archivo1Registro" ADD CONSTRAINT "Archivo1Registro_importacionId_fkey" FOREIGN KEY ("importacionId") REFERENCES "Archivo1Importacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Archivo2Registro" ADD CONSTRAINT "Archivo2Registro_importacionId_fkey" FOREIGN KEY ("importacionId") REFERENCES "Archivo2Importacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Archivo3Registro" ADD CONSTRAINT "Archivo3Registro_importacionId_fkey" FOREIGN KEY ("importacionId") REFERENCES "Archivo3Importacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

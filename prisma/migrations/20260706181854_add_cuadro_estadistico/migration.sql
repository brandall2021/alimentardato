-- CreateTable
CREATE TABLE "CuadroEstadistico" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CuadroEstadistico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CuadroEstadistico_numero_key" ON "CuadroEstadistico"("numero");

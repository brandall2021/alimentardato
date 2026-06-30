-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('DNI', 'LE', 'LC', 'PASAPORTE');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Consulta" (
    "id" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "email" TEXT,
    "tipo" TEXT NOT NULL,
    "valores" TEXT NOT NULL,
    "resultados" INTEGER NOT NULL DEFAULT 0,
    "filtros" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Consulta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alumno" (
    "id" TEXT NOT NULL,
    "apellidoNombre" TEXT NOT NULL,
    "tipoDocumento" "TipoDocumento" NOT NULL DEFAULT 'DNI',
    "numeroDocumento" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3),
    "email" TEXT,
    "telefono" TEXT,
    "legajo" TEXT,
    "plan" TEXT,
    "anoIngreso" INTEGER,
    "fechaIngreso" TIMESTAMP(3),
    "ultimoExamen" TIMESTAMP(3),
    "ultimaReinscripcion" TIMESTAMP(3),
    "promConAplazos" DOUBLE PRECISION,
    "promSinAplazos" DOUBLE PRECISION,
    "actividadesAprobadas" INTEGER,
    "totalActividades" INTEGER,
    "estadoInscripcion" TEXT,
    "paisOrigen" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alumno_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Consulta_createdAt_idx" ON "Consulta"("createdAt");

-- CreateIndex
CREATE INDEX "Consulta_usuario_idx" ON "Consulta"("usuario");

-- CreateIndex
CREATE INDEX "Alumno_numeroDocumento_idx" ON "Alumno"("numeroDocumento");

-- CreateIndex
CREATE INDEX "Alumno_legajo_idx" ON "Alumno"("legajo");

-- CreateIndex
CREATE INDEX "Alumno_email_idx" ON "Alumno"("email");

-- CreateIndex
CREATE INDEX "Alumno_plan_idx" ON "Alumno"("plan");

-- CreateIndex
CREATE INDEX "Alumno_anoIngreso_idx" ON "Alumno"("anoIngreso");

-- CreateIndex
CREATE INDEX "Alumno_estadoInscripcion_idx" ON "Alumno"("estadoInscripcion");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

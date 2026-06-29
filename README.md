# Alimentar Dato

Sistema de búsqueda y consulta de alumnos. Permite buscar por N° de Documento, Legajo o Email — inclusive pegando múltiples valores a la vez — con detección automática del tipo de dato.

## Stack

- **Framework:** Next.js 16 (App Router)
- **ORM:** Prisma 7 + PostgreSQL
- **Autenticación:** NextAuth v5 con Google OAuth
- **Estilos:** Tailwind CSS v4
- **Import/Export:** SheetJS (xlsx)

## Funcionalidades

- **Búsqueda inteligente:** pegar uno o varios DNI, Legajos o Emails separados por salto de línea, coma o espacio. El sistema detecta automáticamente el tipo y busca en el campo correspondiente.
- **Filtros adicionales:** buscar por Plan, Año Ingreso o Estado de inscripción para listar grupos completos de alumnos.
- **Resultados:** tabla con Apellido y Nombre, Email y Teléfono. Los valores no encontrados se marcan como "No encontrado".
- **Exportar a Excel:** descarga los resultados en formato .xlsx.
- **Importar desde Excel:** carga una base existente mapeando columnas con nombres alternativos (soporta múltiples formatos).
- **Control de acceso:** login con Google OAuth, solo usuarios autorizados pueden acceder.
- **Dashboard:** resumen de alumnos, acceso rápido a planes y años de ingreso.

## Requisitos

- Node.js 20+
- PostgreSQL
- Google OAuth credentials (console.cloud.google.com)

## Configuración local

```bash
# Clonar el repositorio
git clone https://github.com/brandall2021/alimentardato.git
cd alimentardato

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con: DATABASE_URL, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, NEXTAUTH_SECRET, ADMIN_EMAIL

# Crear la base de datos
pnpm prisma migrate dev --name init

# (Opcional) Insertar datos de ejemplo
pnpm db:seed

# Iniciar en desarrollo
pnpm dev
```

## Despliegue en Dokploy

### 1. Construir y pushear la imagen Docker

```bash
docker build -t alimentardato .
docker tag alimentardato ghcr.io/tu-usuario/alimentardato:latest
docker push ghcr.io/tu-usuario/alimentardato:latest
```

### 2. Configurar en Dokploy

| Campo | Valor |
|---|---|
| **Nombre** | `alimentardato` |
| **Imagen** | `ghcr.io/tu-usuario/alimentardato:latest` |
| **Puerto interno** | `3000` |
| **Tipo** | HTTP |

### 3. Variables de entorno en Dokploy

```
DATABASE_URL=postgresql://user:pass@host:5432/alimentardato
AUTH_GOOGLE_ID=tu-client-id
AUTH_GOOGLE_SECRET=tu-client-secret
NEXTAUTH_URL=https://alimentardato.tudominio.com
NEXTAUTH_SECRET=genera-con-openssl-rand-base64-32
ADMIN_EMAIL=admin@example.com
```

### 4. Base de datos PostgreSQL en Dokploy

Crear un servicio PostgreSQL desde el panel de Dokploy y usar los datos de conexión en `DATABASE_URL`.

Luego ejecutar las migraciones:

```bash
# Acceder al contenedor y ejecutar
npx prisma migrate deploy
```

O configurar un script de post-deploy en Dokploy que ejecute:

```bash
npx prisma generate && npx prisma migrate deploy
```

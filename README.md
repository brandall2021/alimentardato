# Alimentar Dato

Sistema de búsqueda y consulta de alumnos. Permite buscar por N° de Documento, Legajo o Email — inclusive pegando múltiples valores a la vez — con detección automática del tipo de dato.

## Stack

- **Framework:** Next.js 16 (App Router)
- **ORM:** Prisma 7 + PostgreSQL
- **Autenticación:** NextAuth v5 con credenciales (email/contraseña)
- **Estilos:** Tailwind CSS v4
- **Import/Export:** SheetJS (xlsx)

## Funcionalidades

- **Búsqueda inteligente:** pegar uno o varios DNI, Legajos o Emails separados por salto de línea, coma o espacio. El sistema detecta automáticamente el tipo y busca en el campo correspondiente.
- **Filtros adicionales:** buscar por Plan, Año Ingreso o Estado de inscripción para listar grupos completos de alumnos.
- **Resultados:** tabla con Apellido y Nombre, Email y Teléfono. Los valores no encontrados se marcan como "No encontrado".
- **Exportar a Excel:** descarga los resultados en formato .xlsx.
- **Importar desde Excel:** carga una base existente mapeando columnas con nombres alternativos (soporta múltiples formatos).
- **Control de acceso:** login con email y contraseña, solo usuarios autorizados pueden acceder.
- **Dashboard:** resumen de alumnos, acceso rápido a planes y años de ingreso.
- **Historial de consultas:** registro de quién buscó qué y cuándo.
- **Edición inline:** completar email o teléfono faltante directamente desde los resultados.

## Requisitos

- Node.js 20+
- PostgreSQL

## Configuración local

```bash
# Clonar el repositorio
git clone https://github.com/brandall2021/alimentardato.git
cd alimentardato

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con: DATABASE_URL

# Crear la base de datos
pnpm prisma migrate dev --name init

# (Opcional) Insertar datos de ejemplo
pnpm db:seed

# Iniciar en desarrollo
pnpm dev
```

### Login

El login usa email y contraseña. Configurar en `.env` o desde la sección **Configuración** del panel admin:

```
DEV_EMAIL=admin@alimentardato.com
DEV_PASSWORD=admin123
```

## Despliegue en Dokploy

### 1. Construir y pushear la imagen Docker

```bash
docker build -t alimentardato .
docker tag alimentardato ghcr.io/brandall2021/alimentardato:latest
docker push ghcr.io/brandall2021/alimentardato:latest
```

### 2. Configurar en Dokploy

| Campo | Valor |
|---|---|
| **Nombre** | `alimentardato` |
| **Imagen** | `ghcr.io/brandall2021/alimentardato:latest` |
| **Puerto interno** | `3000` |
| **Tipo** | HTTP |

### 3. Variables de entorno en Dokploy

```
DATABASE_URL=postgresql://user:pass@host:5432/alimentardato
NEXTAUTH_URL=https://alimentardato.tudominio.com
NEXTAUTH_SECRET=genera-con-openssl-rand-base64-32
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

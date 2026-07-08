# Alimentar Dato

> Sistema de gestión y consulta de alumnos — **FACET · Universidad Nacional de Tucumán**

---

## Stack

| Capa | Tecnología |
|---|---|
| **Framework** | Next.js 16 (App Router, standalone output) |
| **ORM** | Prisma 7 + PostgreSQL |
| **Autenticación** | NextAuth v5 beta (Credentials + Google OAuth + GitHub OAuth) |
| **Estilos** | Tailwind CSS v4, Recharts |
| **Import/Export** | SheetJS (xlsx), pipe-delimited TXT |
| **AI (Chatbot)** | OpenAI GPT-4o-mini con function calling |
| **Runtime** | Node.js 20+, pnpm |

---

## Funcionalidades

### Módulo Alumnos
- **Búsqueda inteligente** — Pegar uno o varios DNI, Legajos o Emails separados por salto de línea, coma o espacio. El sistema detecta automáticamente el tipo de dato y consulta el campo correspondiente.
- **Filtros avanzados** — Filtrar por Plan, Año de Ingreso o Estado de inscripción para listar grupos completos.
- **Resultados** — Tabla con Apellido y Nombre, Email, Teléfono. No encontrados se marcan en rojo.
- **Exportar a Excel** — Descarga resultados en .xlsx.
- **Importar desde Excel** — Carga alumnos mapeando columnas con nombres alternativos. Disponible en Configuración.
- **Edición inline** — Completar email o teléfono faltante directamente desde los resultados.

### Módulo Araucano
- **Importación de TXT** — Parseo de archivos pipe-delimited con 28 campos, selector de columnas e importación por lotes.
- **Vaciar datos** — Eliminación completa de registros e importaciones.

### Módulo Archivos (0 / 1 / 2 / 3)
- **4 tipos de archivos** estructurados (0: datos personales, 1: títulos/ingreso, 2: materias aprobadas, 3: materias regularizadas).
- **Previsualización** — Vista de las primeras 20 líneas con resaltado de errores.
- **Importación** con detección de duplicados y reporte detallado de errores.
- **Dashboard** — Estadísticas de solapamiento, documentos únicos por archivo, pares de intersección.
- **Cuadros estadísticos** — 19 cuadros predefinidos (distribución por género, edad, planes, discapacidades, etc.) con generación/borrado individual o masivo.
- **Documentos relacionados** — Búsqueda de un documento en los 4 archivos simultáneamente.

### Consultas SQL (Chatbot)
- **Interfaz conversacional** dentro del panel admin.
- **Agente especializado** con OpenAI GPT-4o-mini que conoce el esquema completo de la base de datos.
- **Generación automática de SQL** a partir de lenguaje natural en español argentino.
- **Ejecución segura** — Solo SELECT; bloqueo de DDL/DML; timeout de 15s; límite de 500 filas.
- **Resultados formateados** con tabla, código SQL visible y cantidad de filas.

### Historial de consultas
- Registro de todas las búsquedas realizadas con paginación.

### Dashboard
- Resumen de alumnos, gráficos de tendencia, distribución por plan y año de ingreso.

### Control de acceso
- Login con credenciales locales (email + contraseña con bcrypt).
- OAuth opcional con Google y GitHub.
- Redirección automática al login si no hay sesión.
- Recuperación de contraseña con token por email (solo consola en desarrollo).

---

## Modelo de datos (20 tablas)

| Tabla | Descripción |
|---|---|
| **User, Account, Session, VerificationToken** | Autenticación NextAuth |
| **Configuracion** | Clave-valor para ajustes del sistema |
| **Alumno** | Datos de alumnos (búsqueda principal) |
| **Consulta** | Log de consultas realizadas |
| **AraucanoRegistro / AraucanoImportacion** | Datos del sistema Araucano |
| **Archivo{0-3}Registro / Archivo{0-3}Importacion** | 4 tipos de archivos estructurados |
| **PuebloOriginario, Pais** | Catálogos |
| **Notification** | Notificaciones del sistema |
| **CuadroEstadistico** | Cuadros estadísticos generados (JSON) |

---

## Requisitos

- Node.js 20+
- PostgreSQL 15+
- pnpm 10+

---

## Configuración local

```bash
# Clonar
git clone https://github.com/brandall2021/alimentardato.git
cd alimentardato

# Instalar dependencias
pnpm install

# Variables de entorno
cp .env.example .env
# Editar DATABASE_URL con tus credenciales PostgreSQL

# Inicializar base de datos
pnpm prisma migrate dev --name init

# (Opcional) Datos de ejemplo
pnpm db:seed

# Iniciar desarrollo
pnpm dev
```

### Variables de entorno

```
DATABASE_URL="postgresql://user:password@host:5432/alimentardato?schema=public"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generar-con: openssl rand -base64 32"

# OAuth (opcional)
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
AUTH_GITHUB_ID=""
AUTH_GITHUB_SECRET=""

ADMIN_EMAIL="admin@example.com"

# Credenciales locales
DEV_EMAIL="admin@alimentardato.com"
DEV_PASSWORD="admin123"

# Chatbot SQL (requerido para el módulo Consultas SQL)
OPENAI_API_KEY="sk-..."
```

### Login

Las credenciales por defecto se configuran via variables de entorno o desde el panel **Configuración**:

| Campo | Valor por defecto |
|---|---|
| Email | `admin@alimentardato.com` |
| Contraseña | `admin123` |

---

## Chatbot SQL

El módulo **Consultas SQL** permite hacer preguntas en lenguaje natural y obtener respuestas consultando la base de datos en tiempo real.

### Cómo funciona

1. El usuario escribe una pregunta (ej: *"¿Cuántos alumnos hay por plan?"*).
2. La API envía el mensaje junto con el esquema completo de la BD a GPT-4o-mini.
3. El modelo decide qué SQL escribir y llama a la herramienta `execute_sql`.
4. La API ejecuta la consulta de forma segura y devuelve los resultados.
5. GPT genera una respuesta en lenguaje natural explicando los resultados.

### Seguridad

- Solo se ejecutan consultas **SELECT**.
- Bloqueo de sentencias DDL/DML (`INSERT`, `UPDATE`, `DELETE`, `DROP`, etc.).
- Timeout de 15 segundos por consulta.
- Máximo 500 filas devueltas.
- Máximo 8000 caracteres por consulta.
- Autenticación requerida (sesión de admin).

### Requisito

Configurar `OPENAI_API_KEY` en `.env`. Se recomienda una key de GPT-4o-mini por su balance costo/calidad.

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `pnpm dev` | Iniciar servidor de desarrollo |
| `pnpm build` | Compilar para producción |
| `pnpm start` | Iniciar servidor de producción |
| `pnpm lint` | Ejecutar ESLint |
| `pnpm db:seed` | Sembrar datos de ejemplo |

---

## Despliegue (Dokploy)

Dokploy puede desplegar directamente desde el repositorio de GitHub.

| Campo | Valor |
|---|---|
| **Repositorio** | `https://github.com/brandall2021/alimentardato` |
| **Rama** | `principal` |
| **Puerto interno** | `3000` |
| **Comando de build** | `pnpm run build` |
| **Comando de start** | `pnpm start` |
| **Tipo** | HTTP |

### Dockerfile

El proyecto incluye un `Dockerfile` multi-stage listo para producción.

### Variables de entorno en Dokploy

```
DATABASE_URL=postgresql://user:pass@host:5432/alimentardato
NEXTAUTH_URL=https://alimentardato.tudominio.com
NEXTAUTH_SECRET=generar-con-openssl
OPENAI_API_KEY=sk-...
```

Cada push a `principal` dispara un redeploy automático.

### Migraciones en producción

```bash
pnpm prisma migrate deploy
```

---

## Estructura del proyecto

```
src/
├── actions/           # Server Actions
│   ├── alumnos.ts     # Búsqueda, filtros, exportación
│   ├── araucano.ts    # Importación TXT Araucano
│   ├── archivos.ts    # 4 archivostipos + dashboard + cuadros
│   ├── consultas.ts   # Historial de consultas
│   ├── configuracion.ts
│   └── configuracion-actions.ts
├── app/
│   ├── admin/
│   │   ├── login/
│   │   ├── forgot-password/
│   │   ├── reset-password/
│   │   ├── archivos/        # (fuera del grupo protegido)
│   │   └── (protected)/     # Layout con auth + navbar
│   │       ├── page.tsx           # Dashboard
│   │       ├── alumnos/
│   │       ├── araucano/
│   │       ├── archivos/          # (redirect)
│   │       ├── chatbot/           # Consultas SQL
│   │       ├── consultas/
│   │       ├── configuracion/
│   │       ├── loading.tsx
│   │       └── error.tsx
│   └── api/
│       ├── auth/           # NextAuth + reset password
│       ├── chatbot/        # Endpoint del chatbot SQL
│       └── notificaciones/
├── components/          # Componentes compartidos
├── lib/
│   ├── auth.ts          # Config NextAuth
│   ├── auth-guard.ts    # Middleware de protección
│   ├── db-schema.ts     # Introspección de esquema (chatbot)
│   ├── parse-utils.ts   # Utilidades de parseo compartidas
│   └── prisma.ts        # Cliente Prisma singleton
├── types/               # Augmentación de tipos
└── generated/prisma/    # Cliente Prisma generado
```

---

## Licencia

Proyecto interno de la **Facultad de Ciencias Económicas · Universidad Nacional de Tucumán**.

'use server'

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-guard'
import { revalidatePath } from 'next/cache'
import { parseDateAAAAMMDD, limpiarString, parseNumero, parseSN } from '@/lib/parse-utils'

export type ArchivoKey = 'archivo0' | 'archivo1' | 'archivo2' | 'archivo3'

const ARCHIVO_PATHS: Record<ArchivoKey, string> = {
  archivo0: '/admin/archivos',
  archivo1: '/admin/archivos',
  archivo2: '/admin/archivos',
  archivo3: '/admin/archivos',
}

// ─── Archivo 0 (28 campos, datos personales) ───

const CAMPOS_A0 = 28

export interface LineaA0 {
  fila: number
  valida: boolean
  error?: string
  datos?: {
    apellido: string
    nombres: string
    tipoDocumento: number
    numeroDocumento: string
    cuil: string
    genero: number
    fechaNacimiento: Date
    cue: string
    horasTrabajo: string
    nivelPadre: number
    nivelMadre: number
    paisNacimiento: number
    paisProcedencia: number
    fechaIngresoPais: Date | null
    paisTitulo: number
    localidad: number | null
    identidadGenero: number
    identidadGeneroTexto: string | null
    puebloOriginario: number | null
    puebloTexto: string | null
    discapacidad: string
    tieneCud: string
    auditiva: string
    visual: string
    motora: string
    psicosocial: string
    otraDiscapacidad: string
    descripcionDiscapacidad: string | null
  }
}

export async function parsearArchivo0(base64: string): Promise<{
  lineas: LineaA0[]
  total: number
  validas: number
  errores: number
}> {
  await requireAdmin()

  const buf = Buffer.from(base64, 'base64')
  const contenido = buf.toString('utf-8')
  const lineasRaw = contenido.split(/\r?\n/).filter((l) => l.trim())

  const lineas: LineaA0[] = []
  let validas = 0
  let errores = 0

  for (let i = 0; i < lineasRaw.length; i++) {
    const fila = i + 1
    const raw = lineasRaw[i].trim()
    if (!raw) continue

    let partes = raw.split('|')
    if (partes.length === CAMPOS_A0 + 1 && partes[partes.length - 1] === '') {
      partes = partes.slice(0, CAMPOS_A0)
    }

    if (partes.length !== CAMPOS_A0) {
      lineas.push({ fila, valida: false, error: `Se esperaban ${CAMPOS_A0} campos, se obtuvieron ${partes.length}` })
      errores++
      continue
    }

    try {
      const [
        apellido, nombres, td, nd, cuil, gen, fechaNac,
        cue, ht, nivP, nivM, paisN, paisP,
        fechaIngPais, paisT, loc, idGen, idGenText,
        pueblOri, pueblText, disc, cud, aud, vis,
        mot, psic, otraDisc, descDisc,
      ] = partes.map(limpiarString)

      if (!apellido) {
        lineas.push({ fila, valida: false, error: 'Apellido es obligatorio' })
        errores++; continue
      }
      if (!nd || nd.length < 4 || nd.length > 30) {
        lineas.push({ fila, valida: false, error: 'Número Documento debe tener entre 4 y 30 caracteres' })
        errores++; continue
      }
      if (!cuil || cuil.length !== 11) {
        lineas.push({ fila, valida: false, error: 'CUIL debe tener 11 dígitos' })
        errores++; continue
      }

      const fechaNacDate = parseDateAAAAMMDD(fechaNac)
      if (!fechaNacDate) {
        lineas.push({ fila, valida: false, error: 'Fecha de Nacimiento inválida (AAAAMMDD)' })
        errores++; continue
      }

      lineas.push({
        fila,
        valida: true,
        datos: {
          apellido,
          nombres,
          tipoDocumento: parseNumero(td) ?? 0,
          numeroDocumento: nd,
          cuil,
          genero: parseNumero(gen) ?? 0,
          fechaNacimiento: fechaNacDate,
          cue,
          horasTrabajo: ht,
          nivelPadre: parseNumero(nivP) ?? 0,
          nivelMadre: parseNumero(nivM) ?? 0,
          paisNacimiento: parseNumero(paisN) ?? 0,
          paisProcedencia: parseNumero(paisP) ?? 0,
          fechaIngresoPais: fechaIngPais ? parseDateAAAAMMDD(fechaIngPais) : null,
          paisTitulo: parseNumero(paisT) ?? 0,
          localidad: parseNumero(loc),
          identidadGenero: parseNumero(idGen) ?? 0,
          identidadGeneroTexto: idGenText || null,
          puebloOriginario: parseNumero(pueblOri),
          puebloTexto: pueblText || null,
          discapacidad: parseSN(disc),
          tieneCud: parseSN(cud),
          auditiva: parseSN(aud),
          visual: parseSN(vis),
          motora: parseSN(mot),
          psicosocial: parseSN(psic),
          otraDiscapacidad: parseSN(otraDisc),
          descripcionDiscapacidad: descDisc || null,
        },
      })
      validas++
    } catch {
      lineas.push({ fila, valida: false, error: 'Error al procesar la línea' })
      errores++
    }
  }

  return { lineas, total: lineas.length, validas, errores }
}

// ─── Archivo 1 (12 campos, cohorte/título) ───

const CAMPOS_A1 = 12

export interface LineaA1 {
  fila: number
  valida: boolean
  error?: string
  datos?: {
    tipoDocumento: number
    numeroDocumento: string
    cuil: string
    unidadAcademica: number
    codigoTitulo: number
    anioCohorte: number
    fechaIngreso: Date
    formaIngreso: number
    fechaEgreso: Date | null
    dependenciaIngreso: number
    dependenciaEgreso: number | null
    requiereTesis: string
  }
}

export async function parsearArchivo1(base64: string): Promise<{
  lineas: LineaA1[]
  total: number
  validas: number
  errores: number
}> {
  await requireAdmin()

  const buf = Buffer.from(base64, 'base64')
  const contenido = buf.toString('utf-8')
  const lineasRaw = contenido.split(/\r?\n/).filter((l) => l.trim())

  const lineas: LineaA1[] = []
  let validas = 0
  let errores = 0

  for (let i = 0; i < lineasRaw.length; i++) {
    const fila = i + 1
    const raw = lineasRaw[i].trim()
    if (!raw) continue

    let partes = raw.split('|')
    if (partes.length === CAMPOS_A1 + 1 && partes[partes.length - 1] === '') {
      partes = partes.slice(0, CAMPOS_A1)
    }

    if (partes.length !== CAMPOS_A1) {
      lineas.push({ fila, valida: false, error: `Se esperaban ${CAMPOS_A1} campos, se obtuvieron ${partes.length}` })
      errores++
      continue
    }

    try {
      const [td, nd, cuil, ua, ct, anio, fIng, fIngreso, fEgr, depIng, depEgr, reqTesis] = partes.map(limpiarString)

      if (!nd || nd.length < 4 || nd.length > 30) {
        lineas.push({ fila, valida: false, error: 'Número Documento inválido' })
        errores++; continue
      }
      if (!cuil || cuil.length !== 11) {
        lineas.push({ fila, valida: false, error: 'CUIL debe tener 11 dígitos' })
        errores++; continue
      }

      const fechaIngresoDate = parseDateAAAAMMDD(fIng)
      if (!fechaIngresoDate) {
        lineas.push({ fila, valida: false, error: 'Fecha de Ingreso inválida (AAAAMMDD)' })
        errores++; continue
      }

      lineas.push({
        fila,
        valida: true,
        datos: {
          tipoDocumento: parseNumero(td) ?? 0,
          numeroDocumento: nd,
          cuil,
          unidadAcademica: parseNumero(ua) ?? 0,
          codigoTitulo: parseNumero(ct) ?? 0,
          anioCohorte: parseNumero(anio) ?? 0,
          fechaIngreso: fechaIngresoDate,
          formaIngreso: parseNumero(fIngreso) ?? 0,
          fechaEgreso: fEgr ? parseDateAAAAMMDD(fEgr) : null,
          dependenciaIngreso: parseNumero(depIng) ?? 0,
          dependenciaEgreso: parseNumero(depEgr),
          requiereTesis: parseSN(reqTesis),
        },
      })
      validas++
    } catch {
      lineas.push({ fila, valida: false, error: 'Error al procesar la línea' })
      errores++
    }
  }

  return { lineas, total: lineas.length, validas, errores }
}

// ─── Archivo 2 (18 campos, materias aprobadas) ───

const CAMPOS_A2 = 18

export interface LineaA2 {
  fila: number
  valida: boolean
  error?: string
  datos?: {
    tipoDocumento: number
    numeroDocumento: string
    cuil: string
    unidadAcademica: number
    codigoTitulo: number
    fechaAprobacion: Date
    estado: number
    codigoMateria: string
    nombreMateria: string
    cargaHoraria: number | null
    obligatoriedad: number | null
    formaAprobacion: number
    dependencia: number
    anioCursada: number | null
    libro: string | null
    acta: string | null
    folio: string | null
    expediente: string | null
  }
}

export async function parsearArchivo2(base64: string): Promise<{
  lineas: LineaA2[]
  total: number
  validas: number
  errores: number
}> {
  await requireAdmin()

  const buf = Buffer.from(base64, 'base64')
  const contenido = buf.toString('utf-8')
  const lineasRaw = contenido.split(/\r?\n/).filter((l) => l.trim())

  const lineas: LineaA2[] = []
  let validas = 0
  let errores = 0

  for (let i = 0; i < lineasRaw.length; i++) {
    const fila = i + 1
    const raw = lineasRaw[i].trim()
    if (!raw) continue

    let partes = raw.split('|')
    if (partes.length === CAMPOS_A2 + 1 && partes[partes.length - 1] === '') {
      partes = partes.slice(0, CAMPOS_A2)
    }

    if (partes.length !== CAMPOS_A2) {
      lineas.push({ fila, valida: false, error: `Se esperaban ${CAMPOS_A2} campos, se obtuvieron ${partes.length}` })
      errores++
      continue
    }

    try {
      const [td, nd, cuil, ua, ct, fApr, est, codMat, nomMat, cargHor, oblig, fAprb, dep, anioCur, lib, act, fol, exp] = partes.map(limpiarString)

      if (!nd || nd.length < 4 || nd.length > 30) {
        lineas.push({ fila, valida: false, error: 'Número Documento inválido' })
        errores++; continue
      }
      if (!cuil || cuil.length !== 11) {
        lineas.push({ fila, valida: false, error: 'CUIL debe tener 11 dígitos' })
        errores++; continue
      }

      const fechaAprDate = parseDateAAAAMMDD(fApr)
      if (!fechaAprDate) {
        lineas.push({ fila, valida: false, error: 'Fecha de Aprobación inválida (AAAAMMDD)' })
        errores++; continue
      }
      if (!codMat) {
        lineas.push({ fila, valida: false, error: 'Código de Materia es obligatorio' })
        errores++; continue
      }

      lineas.push({
        fila,
        valida: true,
        datos: {
          tipoDocumento: parseNumero(td) ?? 0,
          numeroDocumento: nd,
          cuil,
          unidadAcademica: parseNumero(ua) ?? 0,
          codigoTitulo: parseNumero(ct) ?? 0,
          fechaAprobacion: fechaAprDate,
          estado: parseNumero(est) ?? 0,
          codigoMateria: codMat,
          nombreMateria: nomMat,
          cargaHoraria: parseNumero(cargHor),
          obligatoriedad: parseNumero(oblig),
          formaAprobacion: parseNumero(fAprb) ?? 0,
          dependencia: parseNumero(dep) ?? 0,
          anioCursada: parseNumero(anioCur),
          libro: lib || null,
          acta: act || null,
          folio: fol || null,
          expediente: exp || null,
        },
      })
      validas++
    } catch {
      lineas.push({ fila, valida: false, error: 'Error al procesar la línea' })
      errores++
    }
  }

  return { lineas, total: lineas.length, validas, errores }
}

// ─── Archivo 3 (17 campos, materias regularizadas) ───

const CAMPOS_A3 = 17

export interface LineaA3 {
  fila: number
  valida: boolean
  error?: string
  datos?: {
    tipoDocumento: number
    numeroDocumento: string
    cuil: string
    unidadAcademica: number
    codigoTitulo: number
    fechaRegularizacion: Date
    estado: number
    codigoMateria: string
    nombreMateria: string
    cargaHoraria: number | null
    obligatoriedad: number | null
    formaRegularizacion: number
    dependencia: number
    libro: string | null
    acta: string | null
    folio: string | null
    expediente: string | null
  }
}

export async function parsearArchivo3(base64: string): Promise<{
  lineas: LineaA3[]
  total: number
  validas: number
  errores: number
}> {
  await requireAdmin()

  const buf = Buffer.from(base64, 'base64')
  const contenido = buf.toString('utf-8')
  const lineasRaw = contenido.split(/\r?\n/).filter((l) => l.trim())

  const lineas: LineaA3[] = []
  let validas = 0
  let errores = 0

  for (let i = 0; i < lineasRaw.length; i++) {
    const fila = i + 1
    const raw = lineasRaw[i].trim()
    if (!raw) continue

    let partes = raw.split('|')
    if (partes.length === CAMPOS_A3 + 1 && partes[partes.length - 1] === '') {
      partes = partes.slice(0, CAMPOS_A3)
    }

    if (partes.length !== CAMPOS_A3) {
      lineas.push({ fila, valida: false, error: `Se esperaban ${CAMPOS_A3} campos, se obtuvieron ${partes.length}` })
      errores++
      continue
    }

    try {
      const [td, nd, cuil, ua, ct, fReg, est, codMat, nomMat, cargHor, oblig, fReglz, dep, lib, act, fol, exp] = partes.map(limpiarString)

      if (!nd || nd.length < 4 || nd.length > 30) {
        lineas.push({ fila, valida: false, error: 'Número Documento inválido' })
        errores++; continue
      }
      if (!cuil || cuil.length !== 11) {
        lineas.push({ fila, valida: false, error: 'CUIL debe tener 11 dígitos' })
        errores++; continue
      }

      const fechaRegDate = parseDateAAAAMMDD(fReg)
      if (!fechaRegDate) {
        lineas.push({ fila, valida: false, error: 'Fecha de Regularización inválida (AAAAMMDD)' })
        errores++; continue
      }
      if (!codMat) {
        lineas.push({ fila, valida: false, error: 'Código de Materia es obligatorio' })
        errores++; continue
      }

      lineas.push({
        fila,
        valida: true,
        datos: {
          tipoDocumento: parseNumero(td) ?? 0,
          numeroDocumento: nd,
          cuil,
          unidadAcademica: parseNumero(ua) ?? 0,
          codigoTitulo: parseNumero(ct) ?? 0,
          fechaRegularizacion: fechaRegDate,
          estado: parseNumero(est) ?? 0,
          codigoMateria: codMat,
          nombreMateria: nomMat,
          cargaHoraria: parseNumero(cargHor),
          obligatoriedad: parseNumero(oblig),
          formaRegularizacion: parseNumero(fReglz) ?? 0,
          dependencia: parseNumero(dep) ?? 0,
          libro: lib || null,
          acta: act || null,
          folio: fol || null,
          expediente: exp || null,
        },
      })
      validas++
    } catch {
      lineas.push({ fila, valida: false, error: 'Error al procesar la línea' })
      errores++
    }
  }

  return { lineas, total: lineas.length, validas, errores }
}

// ─── Importación (alta masiva) ───

async function importarRegistros<T>(
  archivo: ArchivoKey,
  base64: string,
  parseFn: (b64: string) => Promise<{ lineas: ({ fila: number; valida: boolean; error?: string; datos?: T })[]; validas: number }>,
  createRegistro: (importacionId: string, datos: T) => Promise<unknown>,
  createImportacion: (filename: string, filas: number) => Promise<{ id: string }>,
  updateImportacion: (id: string, importados: number, errores: number) => Promise<unknown>,
) {
  await requireAdmin()

  const { lineas } = await parseFn(base64)
  const aImportar = lineas.filter((l) => l.valida)

  if (aImportar.length === 0) {
    return { importados: 0, errores: 0, detalles: [] }
  }

  const importacion = await createImportacion(
    `${archivo}_${new Date().toISOString().slice(0, 10)}.txt`,
    aImportar.length,
  )

  const detalles: { fila: number; exito: boolean; error?: string }[] = []
  let ok = 0
  let err = 0

  for (const linea of aImportar) {
    if (!linea.valida || !linea.datos) {
      detalles.push({ fila: linea.fila, exito: false, error: linea.error })
      err++
      continue
    }

    try {
      await createRegistro(importacion.id, linea.datos)
      detalles.push({ fila: linea.fila, exito: true })
      ok++
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error desconocido'
      detalles.push({ fila: linea.fila, exito: false, error: msg })
      err++
    }
  }

  await updateImportacion(importacion.id, ok, err)
  revalidatePath(ARCHIVO_PATHS[archivo])

  return { importados: ok, errores: err, detalles, importacionId: importacion.id }
}

function createRegistro0(id: string, d: NonNullable<LineaA0['datos']>) {
  return prisma.archivo0Registro.create({ data: { importacionId: id, ...d } })
}

function createRegistro1(id: string, d: NonNullable<LineaA1['datos']>) {
  return prisma.archivo1Registro.create({ data: { importacionId: id, ...d } })
}

function createRegistro2(id: string, d: NonNullable<LineaA2['datos']>) {
  return prisma.archivo2Registro.create({ data: { importacionId: id, ...d } })
}

function createRegistro3(id: string, d: NonNullable<LineaA3['datos']>) {
  return prisma.archivo3Registro.create({ data: { importacionId: id, ...d } })
}

export async function importarArchivo0(base64: string) {
  return importarRegistros(
    'archivo0',
    base64,
    (b) => parsearArchivo0(b),
    createRegistro0,
    (fn, fl) => prisma.archivo0Importacion.create({ data: { filename: fn, filas: fl } }),
    (id, imp, err) => prisma.archivo0Importacion.update({ where: { id }, data: { importados: imp, errores: err } }),
  )
}

export async function importarArchivo1(base64: string) {
  return importarRegistros(
    'archivo1',
    base64,
    (b) => parsearArchivo1(b),
    createRegistro1,
    (fn, fl) => prisma.archivo1Importacion.create({ data: { filename: fn, filas: fl } }),
    (id, imp, err) => prisma.archivo1Importacion.update({ where: { id }, data: { importados: imp, errores: err } }),
  )
}

export async function importarArchivo2(base64: string) {
  return importarRegistros(
    'archivo2',
    base64,
    (b) => parsearArchivo2(b),
    createRegistro2,
    (fn, fl) => prisma.archivo2Importacion.create({ data: { filename: fn, filas: fl } }),
    (id, imp, err) => prisma.archivo2Importacion.update({ where: { id }, data: { importados: imp, errores: err } }),
  )
}

export async function importarArchivo3(base64: string) {
  return importarRegistros(
    'archivo3',
    base64,
    (b) => parsearArchivo3(b),
    createRegistro3,
    (fn, fl) => prisma.archivo3Importacion.create({ data: { filename: fn, filas: fl } }),
    (id, imp, err) => prisma.archivo3Importacion.update({ where: { id }, data: { importados: imp, errores: err } }),
  )
}

// ─── Borrado masivo ───

export async function vaciarArchivo(archivo: ArchivoKey): Promise<{ eliminados: number }> {
  await requireAdmin()

  let eliminados: number

  switch (archivo) {
    case 'archivo0':
      eliminados = await prisma.archivo0Registro.count()
      await prisma.archivo0Registro.deleteMany()
      await prisma.archivo0Importacion.deleteMany()
      break
    case 'archivo1':
      eliminados = await prisma.archivo1Registro.count()
      await prisma.archivo1Registro.deleteMany()
      await prisma.archivo1Importacion.deleteMany()
      break
    case 'archivo2':
      eliminados = await prisma.archivo2Registro.count()
      await prisma.archivo2Registro.deleteMany()
      await prisma.archivo2Importacion.deleteMany()
      break
    case 'archivo3':
      eliminados = await prisma.archivo3Registro.count()
      await prisma.archivo3Registro.deleteMany()
      await prisma.archivo3Importacion.deleteMany()
      break
  }

  revalidatePath(ARCHIVO_PATHS[archivo])
  return { eliminados }
}

// ─── Consultas relacionadas ───

export interface ResultadoRelacionado {
  archivo: ArchivoKey
  registros: { id: string; numeroDocumento: string; cuil: string }[]
}

export async function buscarRelacionados(documentos: string[]): Promise<ResultadoRelacionado[]> {
  await requireAdmin()

  const docs = documentos.map((d) => d.trim()).filter(Boolean)
  if (docs.length === 0) return []

  const where = { numeroDocumento: { in: docs } }

  const [a0, a1, a2, a3] = await Promise.all([
    prisma.archivo0Registro.findMany({ where, select: { id: true, numeroDocumento: true, cuil: true } }),
    prisma.archivo1Registro.findMany({ where, select: { id: true, numeroDocumento: true, cuil: true } }),
    prisma.archivo2Registro.findMany({ where, select: { id: true, numeroDocumento: true, cuil: true } }),
    prisma.archivo3Registro.findMany({ where, select: { id: true, numeroDocumento: true, cuil: true } }),
  ])

  return [
    { archivo: 'archivo0', registros: a0 },
    { archivo: 'archivo1', registros: a1 },
    { archivo: 'archivo2', registros: a2 },
    { archivo: 'archivo3', registros: a3 },
  ]
}

// ─── Resumen ───

export async function obtenerResumenArchivo(archivo: ArchivoKey): Promise<{
  total: number
  importaciones: number
  ultimaImportacion: { fecha: Date; filas: number; importados: number; errores: number } | null
}> {
  await requireAdmin()

  let total: number
  let importaciones: number
  let ultimaImportacion: { createdAt: Date; filas: number; importados: number; errores: number } | null = null

  switch (archivo) {
    case 'archivo0':
      total = await prisma.archivo0Registro.count()
      importaciones = await prisma.archivo0Importacion.count()
      ultimaImportacion = await prisma.archivo0Importacion.findFirst({ orderBy: { createdAt: 'desc' } })
      break
    case 'archivo1':
      total = await prisma.archivo1Registro.count()
      importaciones = await prisma.archivo1Importacion.count()
      ultimaImportacion = await prisma.archivo1Importacion.findFirst({ orderBy: { createdAt: 'desc' } })
      break
    case 'archivo2':
      total = await prisma.archivo2Registro.count()
      importaciones = await prisma.archivo2Importacion.count()
      ultimaImportacion = await prisma.archivo2Importacion.findFirst({ orderBy: { createdAt: 'desc' } })
      break
    case 'archivo3':
      total = await prisma.archivo3Registro.count()
      importaciones = await prisma.archivo3Importacion.count()
      ultimaImportacion = await prisma.archivo3Importacion.findFirst({ orderBy: { createdAt: 'desc' } })
      break
  }

  return {
    total,
    importaciones,
    ultimaImportacion: ultimaImportacion
      ? { fecha: ultimaImportacion.createdAt, filas: ultimaImportacion.filas, importados: ultimaImportacion.importados, errores: ultimaImportacion.errores }
      : null,
  }
}

// ─── Dashboard ───

export interface OverlapPorTablas {
  tablas: number
  cantidad: number
}

export interface ParIntersec {
  tablaA: string
  tablaB: string
  cantidad: number
}

export interface DashboardArchivos {
  totales: { archivo: ArchivoKey; registros: number }[]
  overlap: OverlapPorTablas[]
  pares: ParIntersec[]
  docsEnTodas: number
  totalDocumentosUnicos: number
}

export async function obtenerDashboardArchivos(): Promise<DashboardArchivos> {
  await requireAdmin()

  const [t0, t1, t2, t3] = await Promise.all([
    prisma.archivo0Registro.count(),
    prisma.archivo1Registro.count(),
    prisma.archivo2Registro.count(),
    prisma.archivo3Registro.count(),
  ])

  const totales: DashboardArchivos['totales'] = [
    { archivo: 'archivo0', registros: t0 },
    { archivo: 'archivo1', registros: t1 },
    { archivo: 'archivo2', registros: t2 },
    { archivo: 'archivo3', registros: t3 },
  ]

  const raw = await prisma.$queryRaw<{ tablas: bigint; cantidad: bigint }[]>`
    WITH docs AS (
      SELECT "numeroDocumento", 'a0' AS src FROM "Archivo0Registro"
      UNION ALL
      SELECT "numeroDocumento", 'a1' FROM "Archivo1Registro"
      UNION ALL
      SELECT "numeroDocumento", 'a2' FROM "Archivo2Registro"
      UNION ALL
      SELECT "numeroDocumento", 'a3' FROM "Archivo3Registro"
    ),
    conteo AS (
      SELECT "numeroDocumento", COUNT(DISTINCT src) AS tablas
      FROM docs
      GROUP BY "numeroDocumento"
    )
    SELECT tablas, COUNT(*)::bigint AS cantidad
    FROM conteo
    GROUP BY tablas
    ORDER BY tablas
  `

  const overlap = raw.map((r) => ({
    tablas: Number(r.tablas),
    cantidad: Number(r.cantidad),
  }))

  const totalDocsRaw = await prisma.$queryRaw<{ total: bigint }[]>`
    SELECT COUNT(*)::bigint AS total FROM (
      SELECT "numeroDocumento" FROM "Archivo0Registro"
      UNION
      SELECT "numeroDocumento" FROM "Archivo1Registro"
      UNION
      SELECT "numeroDocumento" FROM "Archivo2Registro"
      UNION
      SELECT "numeroDocumento" FROM "Archivo3Registro"
    ) u
  `
  const totalDocumentosUnicos = Number(totalDocsRaw[0].total)

  const docsEnTodas = overlap.find((o) => o.tablas === 4)?.cantidad ?? 0

  const pares: ParIntersec[] = []
  const paresData = await Promise.all([
    prisma.$queryRaw<{ cnt: bigint }[]>`SELECT COUNT(*)::bigint AS cnt FROM "Archivo0Registro" x INNER JOIN "Archivo1Registro" y ON x."numeroDocumento" = y."numeroDocumento"`,
    prisma.$queryRaw<{ cnt: bigint }[]>`SELECT COUNT(*)::bigint AS cnt FROM "Archivo0Registro" x INNER JOIN "Archivo2Registro" y ON x."numeroDocumento" = y."numeroDocumento"`,
    prisma.$queryRaw<{ cnt: bigint }[]>`SELECT COUNT(*)::bigint AS cnt FROM "Archivo0Registro" x INNER JOIN "Archivo3Registro" y ON x."numeroDocumento" = y."numeroDocumento"`,
    prisma.$queryRaw<{ cnt: bigint }[]>`SELECT COUNT(*)::bigint AS cnt FROM "Archivo1Registro" x INNER JOIN "Archivo2Registro" y ON x."numeroDocumento" = y."numeroDocumento"`,
    prisma.$queryRaw<{ cnt: bigint }[]>`SELECT COUNT(*)::bigint AS cnt FROM "Archivo1Registro" x INNER JOIN "Archivo3Registro" y ON x."numeroDocumento" = y."numeroDocumento"`,
    prisma.$queryRaw<{ cnt: bigint }[]>`SELECT COUNT(*)::bigint AS cnt FROM "Archivo2Registro" x INNER JOIN "Archivo3Registro" y ON x."numeroDocumento" = y."numeroDocumento"`,
  ])
  const paresLabels = [
    ['Archivo 0', 'Archivo 1'],
    ['Archivo 0', 'Archivo 2'],
    ['Archivo 0', 'Archivo 3'],
    ['Archivo 1', 'Archivo 2'],
    ['Archivo 1', 'Archivo 3'],
    ['Archivo 2', 'Archivo 3'],
  ]
  for (let i = 0; i < paresData.length; i++) {
    pares.push({ tablaA: paresLabels[i][0], tablaB: paresLabels[i][1], cantidad: Number(paresData[i][0].cnt) })
  }

  return { totales, overlap, pares, docsEnTodas, totalDocumentosUnicos }
}

// ─── Cuadros Estadísticos ───

export interface CuadroData {
  numero: number
  nombre: string
  columnas: string[]
  filas: (string | number)[][]
  resumen?: string
}

const CUADROS_INFO: { numero: number; nombre: string; descripcion: string }[] = [
  { numero: 1, nombre: 'Cuadro 1. Estudiantes, Nuevos Inscriptos y Egresados de Grado.', descripcion: 'Datos generales resumidos' },
  { numero: 2, nombre: 'Cuadro 2. Estudiantes, Nuevos Inscriptos y Egresados de Ofertas de Posgrado, por Facultades y por sexo.', descripcion: '' },
  { numero: 3, nombre: 'Cuadro 3. Egresados del año anterior por Carreras y por Año de Ingreso a la Carrera de Grado.', descripcion: '' },
  { numero: 4, nombre: 'Cuadro 4. Re-inscriptos según Materias Aprobadas, por Año de Ingreso a la Oferta de Grado y por Carreras.', descripcion: '' },
  { numero: 5, nombre: 'Cuadro 5. Re-inscriptos según Exámenes Rendidos, por Año de Ingreso a la Oferta de Grado y por Carreras.', descripcion: '' },
  { numero: 6, nombre: 'Cuadro 6. Estudiantes clasificados según Situación de Trabajo, por Unidad Académica, por Carreras y por dedicación en horas semanales.', descripcion: '' },
  { numero: 7, nombre: 'Cuadro 7. Re-inscriptos según cantidad de Materias Aprobadas al año anterior, por Unidad Académica y por Carreras.', descripcion: '' },
  { numero: 8, nombre: 'Cuadro 8. Estudiantes según rangos de edad, clasificados por Facultad, por Carreras y por sexo.', descripcion: '' },
  { numero: 9, nombre: 'Cuadro 9. Nuevos Inscriptos por Primera Vez según rangos de edad, clasificados por Facultad, por Carreras y por sexo.', descripcion: '' },
  { numero: 10, nombre: 'Cuadro 10. Nuevos Inscriptos por Equivalencia según rango de edad, clasificados por Facultad, por Carreras y por sexo.', descripcion: '' },
  { numero: 11, nombre: 'Cuadro 11. Egresados por Equivalencia por Carreras y por Año de Ingreso.', descripcion: '' },
  { numero: 12, nombre: 'Cuadro 12. Estudiantes Matriculados Extranjeros según rangos de edad, por Carrera y por sexo.', descripcion: '' },
  { numero: 13, nombre: 'Cuadro 13. Estudiantes Extranjeros por Actividad Académica.', descripcion: '' },
  { numero: 14, nombre: 'Cuadro 14. Nuevos Inscriptos según situación de trabajo por sexo y según la cantidad de horas que trabajan.', descripcion: '' },
  { numero: 15, nombre: 'Cuadro 15. Nuevos Inscriptos por Instrucción de los padres por sexo.', descripcion: '' },
  { numero: 16, nombre: 'Cuadro 16. Re-inscriptos de Pregrado y Grado según cantidad de Materias Aprobadas.', descripcion: '' },
  { numero: 17, nombre: 'Cuadro 17. Re-inscriptos por Materias Regularizadas.', descripcion: '' },
  { numero: 18, nombre: 'Cuadro 18.-Nuevos Inscriptos según Materias Aprobadas.', descripcion: '' },
  { numero: 19, nombre: 'Cuadro 19.- Nuevos Inscriptos según Materias Regularizadas.', descripcion: '' },
]

function rangoEdad(fechaNac: Date): string {
  const edad = new Date().getFullYear() - fechaNac.getFullYear()
  if (edad < 18) return 'Menor 18'
  if (edad <= 20) return '18-20'
  if (edad <= 24) return '21-24'
  if (edad <= 29) return '25-29'
  if (edad <= 34) return '30-34'
  if (edad <= 39) return '35-39'
  if (edad <= 44) return '40-44'
  if (edad <= 49) return '45-49'
  if (edad <= 54) return '50-54'
  if (edad <= 59) return '55-59'
  return '60+'
}

const GENERO_MAP: Record<number, string> = { 1: 'Varón', 2: 'Mujer', 3: 'Otro' }

async function computeCuadro(numero: number): Promise<CuadroData> {
  const info = CUADROS_INFO[numero - 1]

  switch (numero) {
    case 1: {
      const a0Count = await prisma.archivo0Registro.count()
      const a1Count = await prisma.archivo1Registro.count()
      const egresados = await prisma.archivo1Registro.count({ where: { fechaEgreso: { not: null } } })
      const conTesis = await prisma.archivo1Registro.count({ where: { requiereTesis: 'S' } })
      const sinTesis = await prisma.archivo1Registro.count({ where: { requiereTesis: 'N' } })
      const porGenero = await prisma.$queryRaw<{ genero: number; cantidad: bigint }[]>`
        SELECT a0."genero", COUNT(DISTINCT a0."numeroDocumento")::bigint AS cantidad
        FROM "Archivo0Registro" a0 GROUP BY a0."genero" ORDER BY a0."genero"
      `
      return {
        numero: 1, nombre: info.nombre,
        columnas: ['Indicador', 'Valor'],
        filas: [
          ['Registros Datos Personales (Archivo 0)', a0Count],
          ['Registros Cohorte (Archivo 1)', a1Count],
          ['Egresados', egresados],
          ['Requieren Tesis', conTesis],
          ['No requieren Tesis', sinTesis],
          ...porGenero.map(r => [GENERO_MAP[Number(r.genero)] ?? `Género ${r.genero}`, Number(r.cantidad)]),
        ],
        resumen: `Total ${(a0Count + a1Count).toLocaleString()} registros combinados.`,
      }
    }

    case 2: {
      const porUA = await prisma.$queryRaw<{ ua: number; genero: number; cantidad: bigint }[]>`
        SELECT a1."unidadAcademica" AS ua, a0."genero", COUNT(DISTINCT a1."numeroDocumento")::bigint AS cantidad
        FROM "Archivo1Registro" a1 LEFT JOIN "Archivo0Registro" a0 ON a1."numeroDocumento" = a0."numeroDocumento"
        GROUP BY a1."unidadAcademica", a0."genero" ORDER BY a1."unidadAcademica", a0."genero"
      `
      return {
        numero: 2, nombre: info.nombre,
        columnas: ['Unidad Académica', 'Género', 'Cantidad'],
        filas: porUA.map(r => [r.ua, GENERO_MAP[Number(r.genero)] ?? 'Sin dato', Number(r.cantidad)]),
      }
    }

    case 3: {
      const anioAnterior = new Date().getFullYear() - 1
      const raw = await prisma.$queryRaw<{ codigoTitulo: number; anioCohorte: number; cantidad: bigint }[]>`
        SELECT "codigoTitulo", "anioCohorte", COUNT(*)::bigint AS cantidad
        FROM "Archivo1Registro"
        WHERE EXTRACT(YEAR FROM "fechaEgreso") = ${anioAnterior}
        GROUP BY "codigoTitulo", "anioCohorte" ORDER BY "codigoTitulo", "anioCohorte"
      `
      return {
        numero: 3, nombre: info.nombre,
        columnas: ['Código Carrera', 'Año Ingreso', 'Cantidad Egresados'],
        filas: raw.map(r => [r.codigoTitulo, r.anioCohorte, Number(r.cantidad)]),
        resumen: `Egresados del año ${anioAnterior}`,
      }
    }

    case 4: {
      const raw = await prisma.$queryRaw<{ anioCohorte: number; codigoTitulo: number; cantidad: bigint; materias: bigint }[]>`
        SELECT a1."anioCohorte", a1."codigoTitulo",
               COUNT(DISTINCT a1."numeroDocumento")::bigint AS cantidad,
               COUNT(a2."id")::bigint AS materias
        FROM "Archivo1Registro" a1
        INNER JOIN "Archivo2Registro" a2 ON a1."numeroDocumento" = a2."numeroDocumento"
        GROUP BY a1."anioCohorte", a1."codigoTitulo" ORDER BY a1."anioCohorte", a1."codigoTitulo"
      `
      return {
        numero: 4, nombre: info.nombre,
        columnas: ['Año Cohorte', 'Código Carrera', 'Estudiantes', 'Materias Aprobadas'],
        filas: raw.map(r => [r.anioCohorte, r.codigoTitulo, Number(r.cantidad), Number(r.materias)]),
      }
    }

    case 5: {
      const raw = await prisma.$queryRaw<{ anioCohorte: number; codigoTitulo: number; cantidad: bigint; examenes: bigint }[]>`
        SELECT a1."anioCohorte", a1."codigoTitulo",
               COUNT(DISTINCT a1."numeroDocumento")::bigint AS cantidad,
               COUNT(a2."id")::bigint AS examenes
        FROM "Archivo1Registro" a1
        INNER JOIN "Archivo2Registro" a2 ON a1."numeroDocumento" = a2."numeroDocumento"
        GROUP BY a1."anioCohorte", a1."codigoTitulo" ORDER BY a1."anioCohorte", a1."codigoTitulo"
      `
      return {
        numero: 5, nombre: info.nombre,
        columnas: ['Año Cohorte', 'Código Carrera', 'Estudiantes', 'Exámenes Rendidos'],
        filas: raw.map(r => [r.anioCohorte, r.codigoTitulo, Number(r.cantidad), Number(r.examenes)]),
      }
    }

    case 6: {
      const raw = await prisma.$queryRaw<{ horasTrabajo: string; unidadAcademica: number; codigoTitulo: number; cantidad: bigint }[]>`
        SELECT a0."horasTrabajo", a1."unidadAcademica", a1."codigoTitulo", COUNT(DISTINCT a0."numeroDocumento")::bigint AS cantidad
        FROM "Archivo0Registro" a0
        INNER JOIN "Archivo1Registro" a1 ON a0."numeroDocumento" = a1."numeroDocumento"
        GROUP BY a0."horasTrabajo", a1."unidadAcademica", a1."codigoTitulo"
        ORDER BY a0."horasTrabajo", a1."unidadAcademica", a1."codigoTitulo"
      `
      return {
        numero: 6, nombre: info.nombre,
        columnas: ['Horas Trabajo', 'Unidad Académica', 'Código Carrera', 'Cantidad'],
        filas: raw.map(r => [r.horasTrabajo || 'Sin dato', r.unidadAcademica, r.codigoTitulo, Number(r.cantidad)]),
      }
    }

    case 7: {
      const raw = await prisma.$queryRaw<{ unidadAcademica: number; codigoTitulo: number; cantidad: bigint; materias: bigint }[]>`
        SELECT a1."unidadAcademica", a1."codigoTitulo",
               COUNT(DISTINCT a1."numeroDocumento")::bigint AS cantidad,
               COUNT(a2."id")::bigint AS materias
        FROM "Archivo1Registro" a1
        INNER JOIN "Archivo2Registro" a2 ON a1."numeroDocumento" = a2."numeroDocumento"
        GROUP BY a1."unidadAcademica", a1."codigoTitulo" ORDER BY a1."unidadAcademica", a1."codigoTitulo"
      `
      return {
        numero: 7, nombre: info.nombre,
        columnas: ['Unidad Académica', 'Código Carrera', 'Estudiantes', 'Materias Aprobadas'],
        filas: raw.map(r => [r.unidadAcademica, r.codigoTitulo, Number(r.cantidad), Number(r.materias)]),
      }
    }

    case 8: {
      type RawRow = { numeroDocumento: string; fechaNacimiento: Date; unidadAcademica: number; codigoTitulo: number; genero: number }
      const raw = await prisma.$queryRaw<RawRow[]>`
        SELECT DISTINCT a0."numeroDocumento", a0."fechaNacimiento", a1."unidadAcademica", a1."codigoTitulo", a0."genero"
        FROM "Archivo0Registro" a0
        INNER JOIN "Archivo1Registro" a1 ON a0."numeroDocumento" = a1."numeroDocumento"
      `
      const agrupado = new Map<string, number>()
      for (const r of raw) {
        const key = `${rangoEdad(new Date(r.fechaNacimiento))}|${r.unidadAcademica}|${r.codigoTitulo}|${r.genero}`
        agrupado.set(key, (agrupado.get(key) || 0) + 1)
      }
      const filas = Array.from(agrupado.entries()).map(([k, v]) => {
        const [edad, ua, ct, gen] = k.split('|')
        return [edad, Number(ua), Number(ct), GENERO_MAP[Number(gen)] ?? `Género ${gen}`, v]
      })
      return {
        numero: 8, nombre: info.nombre,
        columnas: ['Rango Edad', 'Unidad Académica', 'Código Carrera', 'Género', 'Cantidad'],
        filas,
      }
    }

    case 9: {
      const raw = await prisma.$queryRaw<{ numeroDocumento: string; fechaNacimiento: Date; unidadAcademica: number; codigoTitulo: number; genero: number }[]>`
        SELECT DISTINCT a0."numeroDocumento", a0."fechaNacimiento", a1."unidadAcademica", a1."codigoTitulo", a0."genero"
        FROM "Archivo0Registro" a0
        INNER JOIN "Archivo1Registro" a1 ON a0."numeroDocumento" = a1."numeroDocumento"
        WHERE a1."formaIngreso" = 1
      `
      const agrupado = new Map<string, number>()
      for (const r of raw) {
        const key = `${rangoEdad(new Date(r.fechaNacimiento))}|${r.unidadAcademica}|${r.codigoTitulo}|${r.genero}`
        agrupado.set(key, (agrupado.get(key) || 0) + 1)
      }
      const filas = Array.from(agrupado.entries()).map(([k, v]) => {
        const [edad, ua, ct, gen] = k.split('|')
        return [edad, Number(ua), Number(ct), GENERO_MAP[Number(gen)] ?? `Género ${gen}`, v]
      })
      return {
        numero: 9, nombre: info.nombre,
        columnas: ['Rango Edad', 'Unidad Académica', 'Código Carrera', 'Género', 'Cantidad'],
        filas,
      }
    }

    case 10: {
      const raw = await prisma.$queryRaw<{ numeroDocumento: string; fechaNacimiento: Date; unidadAcademica: number; codigoTitulo: number; genero: number }[]>`
        SELECT DISTINCT a0."numeroDocumento", a0."fechaNacimiento", a1."unidadAcademica", a1."codigoTitulo", a0."genero"
        FROM "Archivo0Registro" a0
        INNER JOIN "Archivo1Registro" a1 ON a0."numeroDocumento" = a1."numeroDocumento"
        WHERE a1."formaIngreso" = 2
      `
      const agrupado = new Map<string, number>()
      for (const r of raw) {
        const key = `${rangoEdad(new Date(r.fechaNacimiento))}|${r.unidadAcademica}|${r.codigoTitulo}|${r.genero}`
        agrupado.set(key, (agrupado.get(key) || 0) + 1)
      }
      const filas = Array.from(agrupado.entries()).map(([k, v]) => {
        const [edad, ua, ct, gen] = k.split('|')
        return [edad, Number(ua), Number(ct), GENERO_MAP[Number(gen)] ?? `Género ${gen}`, v]
      })
      return {
        numero: 10, nombre: info.nombre,
        columnas: ['Rango Edad', 'Unidad Académica', 'Código Carrera', 'Género', 'Cantidad'],
        filas,
      }
    }

    case 11: {
      const raw = await prisma.$queryRaw<{ codigoTitulo: number; anioCohorte: number; cantidad: bigint }[]>`
        SELECT a1."codigoTitulo", a1."anioCohorte", COUNT(*)::bigint AS cantidad
        FROM "Archivo1Registro" a1
        WHERE a1."fechaEgreso" IS NOT NULL AND a1."formaIngreso" = 2
        GROUP BY a1."codigoTitulo", a1."anioCohorte" ORDER BY a1."codigoTitulo", a1."anioCohorte"
      `
      return {
        numero: 11, nombre: info.nombre,
        columnas: ['Código Carrera', 'Año Ingreso', 'Egresados por Equivalencia'],
        filas: raw.map(r => [r.codigoTitulo, r.anioCohorte, Number(r.cantidad)]),
      }
    }

    case 12: {
      const raw = await prisma.$queryRaw<{ numeroDocumento: string; fechaNacimiento: Date; codigoTitulo: number; genero: number }[]>`
        SELECT DISTINCT a0."numeroDocumento", a0."fechaNacimiento", a1."codigoTitulo", a0."genero"
        FROM "Archivo0Registro" a0
        INNER JOIN "Archivo1Registro" a1 ON a0."numeroDocumento" = a1."numeroDocumento"
        WHERE a0."paisProcedencia" != 0 AND a0."paisProcedencia" != 1
      `
      const agrupado = new Map<string, number>()
      for (const r of raw) {
        const key = `${rangoEdad(new Date(r.fechaNacimiento))}|${r.codigoTitulo}|${r.genero}`
        agrupado.set(key, (agrupado.get(key) || 0) + 1)
      }
      const filas = Array.from(agrupado.entries()).map(([k, v]) => {
        const [edad, ct, gen] = k.split('|')
        return [edad, Number(ct), GENERO_MAP[Number(gen)] ?? `Género ${gen}`, v]
      })
      return {
        numero: 12, nombre: info.nombre,
        columnas: ['Rango Edad', 'Código Carrera', 'Género', 'Cantidad'],
        filas,
      }
    }

    case 13: {
      const raw = await prisma.$queryRaw<{ codigoTitulo: number; cantidad: bigint }[]>`
        SELECT a1."codigoTitulo", COUNT(DISTINCT a1."numeroDocumento")::bigint AS cantidad
        FROM "Archivo1Registro" a1
        INNER JOIN "Archivo0Registro" a0 ON a1."numeroDocumento" = a0."numeroDocumento"
        WHERE a0."paisProcedencia" != 0 AND a0."paisProcedencia" != 1
        GROUP BY a1."codigoTitulo" ORDER BY a1."codigoTitulo"
      `
      return {
        numero: 13, nombre: info.nombre,
        columnas: ['Actividad / Carrera', 'Estudiantes Extranjeros'],
        filas: raw.map(r => [r.codigoTitulo, Number(r.cantidad)]),
      }
    }

    case 14: {
      const raw = await prisma.$queryRaw<{ horasTrabajo: string; genero: number; cantidad: bigint }[]>`
        SELECT a0."horasTrabajo", a0."genero", COUNT(DISTINCT a0."numeroDocumento")::bigint AS cantidad
        FROM "Archivo0Registro" a0
        INNER JOIN "Archivo1Registro" a1 ON a0."numeroDocumento" = a1."numeroDocumento"
        WHERE a1."formaIngreso" IN (1, 2)
        GROUP BY a0."horasTrabajo", a0."genero" ORDER BY a0."horasTrabajo", a0."genero"
      `
      return {
        numero: 14, nombre: info.nombre,
        columnas: ['Horas Trabajo', 'Género', 'Cantidad'],
        filas: raw.map(r => [r.horasTrabajo || 'Sin dato', GENERO_MAP[Number(r.genero)] ?? 'Sin dato', Number(r.cantidad)]),
      }
    }

    case 15: {
      const raw = await prisma.$queryRaw<{ nivelPadre: number; nivelMadre: number; genero: number; cantidad: bigint }[]>`
        SELECT a0."nivelPadre", a0."nivelMadre", a0."genero", COUNT(DISTINCT a0."numeroDocumento")::bigint AS cantidad
        FROM "Archivo0Registro" a0
        INNER JOIN "Archivo1Registro" a1 ON a0."numeroDocumento" = a1."numeroDocumento"
        WHERE a1."formaIngreso" IN (1, 2)
        GROUP BY a0."nivelPadre", a0."nivelMadre", a0."genero"
        ORDER BY a0."nivelPadre", a0."nivelMadre", a0."genero"
      `
      return {
        numero: 15, nombre: info.nombre,
        columnas: ['Nivel Instrucción Padre', 'Nivel Instrucción Madre', 'Género', 'Cantidad'],
        filas: raw.map(r => [r.nivelPadre, r.nivelMadre, GENERO_MAP[Number(r.genero)] ?? 'Sin dato', Number(r.cantidad)]),
      }
    }

    case 16: {
      const raw = await prisma.$queryRaw<{ cantidad: bigint; materias: bigint }[]>`
        SELECT COUNT(DISTINCT a1."numeroDocumento")::bigint AS cantidad,
               COUNT(a2."id")::bigint AS materias
        FROM "Archivo1Registro" a1
        INNER JOIN "Archivo2Registro" a2 ON a1."numeroDocumento" = a2."numeroDocumento"
      `
      const r = raw[0]
      return {
        numero: 16, nombre: info.nombre,
        columnas: ['Indicador', 'Valor'],
        filas: [
          ['Re-inscriptos con materias aprobadas', Number(r?.cantidad ?? 0)],
          ['Total materias aprobadas', Number(r?.materias ?? 0)],
        ],
      }
    }

    case 17: {
      const raw = await prisma.$queryRaw<{ cantidad: bigint; materias: bigint }[]>`
        SELECT COUNT(DISTINCT a1."numeroDocumento")::bigint AS cantidad,
               COUNT(a3."id")::bigint AS materias
        FROM "Archivo1Registro" a1
        INNER JOIN "Archivo3Registro" a3 ON a1."numeroDocumento" = a3."numeroDocumento"
      `
      const r = raw[0]
      return {
        numero: 17, nombre: info.nombre,
        columnas: ['Indicador', 'Valor'],
        filas: [
          ['Re-inscriptos con materias regularizadas', Number(r?.cantidad ?? 0)],
          ['Total materias regularizadas', Number(r?.materias ?? 0)],
        ],
      }
    }

    case 18: {
      const raw = await prisma.$queryRaw<{ cantidad: bigint; materias: bigint }[]>`
        SELECT COUNT(DISTINCT a1."numeroDocumento")::bigint AS cantidad,
               COUNT(a2."id")::bigint AS materias
        FROM "Archivo1Registro" a1
        INNER JOIN "Archivo2Registro" a2 ON a1."numeroDocumento" = a2."numeroDocumento"
        WHERE a1."formaIngreso" IN (1, 2)
      `
      const r = raw[0]
      return {
        numero: 18, nombre: info.nombre,
        columnas: ['Indicador', 'Valor'],
        filas: [
          ['Nuevos inscriptos con materias aprobadas', Number(r?.cantidad ?? 0)],
          ['Total materias aprobadas', Number(r?.materias ?? 0)],
        ],
      }
    }

    case 19: {
      const raw = await prisma.$queryRaw<{ cantidad: bigint; materias: bigint }[]>`
        SELECT COUNT(DISTINCT a1."numeroDocumento")::bigint AS cantidad,
               COUNT(a3."id")::bigint AS materias
        FROM "Archivo1Registro" a1
        INNER JOIN "Archivo3Registro" a3 ON a1."numeroDocumento" = a3."numeroDocumento"
        WHERE a1."formaIngreso" IN (1, 2)
      `
      const r = raw[0]
      return {
        numero: 19, nombre: info.nombre,
        columnas: ['Indicador', 'Valor'],
        filas: [
          ['Nuevos inscriptos con materias regularizadas', Number(r?.cantidad ?? 0)],
          ['Total materias regularizadas', Number(r?.materias ?? 0)],
        ],
      }
    }

    default:
      throw new Error(`Cuadro ${numero} no implementado`)
  }
}

export async function listarCuadros(): Promise<CuadroData[]> {
  await requireAdmin()
  const stored = await prisma.cuadroEstadistico.findMany({ orderBy: { numero: 'asc' } })
  return stored.map(s => ({ numero: s.numero, nombre: s.nombre, ...(s.data as Omit<CuadroData, 'numero' | 'nombre'>) }))
}

export async function generarCuadro(numero: number): Promise<CuadroData> {
  await requireAdmin()
  const data = await computeCuadro(numero)
  await prisma.cuadroEstadistico.upsert({
    where: { numero },
    update: { nombre: data.nombre, data: { columnas: data.columnas, filas: data.filas, resumen: data.resumen } },
    create: { numero, nombre: data.nombre, data: { columnas: data.columnas, filas: data.filas, resumen: data.resumen } },
  })
  revalidatePath('/admin/archivos')
  return data
}

export async function regenerarTodosLosCuadros(): Promise<{ generados: number }> {
  await requireAdmin()
  let generados = 0
  for (const info of CUADROS_INFO) {
    await generarCuadro(info.numero)
    generados++
  }
  return { generados }
}

export async function borrarCuadro(numero: number): Promise<void> {
  await requireAdmin()
  await prisma.cuadroEstadistico.delete({ where: { numero } })
  revalidatePath('/admin/archivos')
}

export async function borrarTodosLosCuadros(): Promise<{ borrados: number }> {
  await requireAdmin()
  const todos = await prisma.cuadroEstadistico.findMany()
  for (const c of todos) {
    await prisma.cuadroEstadistico.delete({ where: { id: c.id } })
  }
  revalidatePath('/admin/archivos')
  return { borrados: todos.length }
}

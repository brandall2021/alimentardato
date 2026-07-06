'use server'

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-guard'
import { revalidatePath } from 'next/cache'

export type ArchivoKey = 'archivo0' | 'archivo1' | 'archivo2' | 'archivo3'

const ARCHIVO_PATHS: Record<ArchivoKey, string> = {
  archivo0: '/admin/archivos',
  archivo1: '/admin/archivos',
  archivo2: '/admin/archivos',
  archivo3: '/admin/archivos',
}

function parseDateAAAAMMDD(val: string): Date | null {
  val = val.trim()
  if (!val || val.length !== 8) return null
  const m = val.match(/^(\d{4})(\d{2})(\d{2})$/)
  if (!m) return null
  const d = new Date(+m[1], +m[2] - 1, +m[3])
  return isNaN(d.getTime()) ? null : d
}

function limpiarString(val: string): string {
  return val.trim()
}

function parseNumero(val: string): number | null {
  const s = val.trim()
  if (!s) return null
  const n = Number(s)
  return isNaN(n) ? null : n
}

function parseSN(val: string): string {
  const s = val.trim().toUpperCase()
  return s === 'S' ? 'S' : 'N'
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

export async function importarArchivo0(base64: string) {
  return importarRegistros(
    'archivo0',
    base64,
    (b) => parsearArchivo0(b),
    (id, d) => prisma.archivo0Registro.create({ data: { ...d as any, importacionId: id } }),
    (fn, fl) => prisma.archivo0Importacion.create({ data: { filename: fn, filas: fl } }),
    (id, imp, err) => prisma.archivo0Importacion.update({ where: { id }, data: { importados: imp, errores: err } }),
  )
}

export async function importarArchivo1(base64: string) {
  return importarRegistros(
    'archivo1',
    base64,
    (b) => parsearArchivo1(b),
    (id, d) => prisma.archivo1Registro.create({ data: { ...d as any, importacionId: id } }),
    (fn, fl) => prisma.archivo1Importacion.create({ data: { filename: fn, filas: fl } }),
    (id, imp, err) => prisma.archivo1Importacion.update({ where: { id }, data: { importados: imp, errores: err } }),
  )
}

export async function importarArchivo2(base64: string) {
  return importarRegistros(
    'archivo2',
    base64,
    (b) => parsearArchivo2(b),
    (id, d) => prisma.archivo2Registro.create({ data: { ...d as any, importacionId: id } }),
    (fn, fl) => prisma.archivo2Importacion.create({ data: { filename: fn, filas: fl } }),
    (id, imp, err) => prisma.archivo2Importacion.update({ where: { id }, data: { importados: imp, errores: err } }),
  )
}

export async function importarArchivo3(base64: string) {
  return importarRegistros(
    'archivo3',
    base64,
    (b) => parsearArchivo3(b),
    (id, d) => prisma.archivo3Registro.create({ data: { ...d as any, importacionId: id } }),
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
  let ultima: unknown

  switch (archivo) {
    case 'archivo0':
      total = await prisma.archivo0Registro.count()
      importaciones = await prisma.archivo0Importacion.count()
      ultima = await prisma.archivo0Importacion.findFirst({ orderBy: { createdAt: 'desc' } })
      break
    case 'archivo1':
      total = await prisma.archivo1Registro.count()
      importaciones = await prisma.archivo1Importacion.count()
      ultima = await prisma.archivo1Importacion.findFirst({ orderBy: { createdAt: 'desc' } })
      break
    case 'archivo2':
      total = await prisma.archivo2Registro.count()
      importaciones = await prisma.archivo2Importacion.count()
      ultima = await prisma.archivo2Importacion.findFirst({ orderBy: { createdAt: 'desc' } })
      break
    case 'archivo3':
      total = await prisma.archivo3Registro.count()
      importaciones = await prisma.archivo3Importacion.count()
      ultima = await prisma.archivo3Importacion.findFirst({ orderBy: { createdAt: 'desc' } })
      break
  }

  const u = ultima as { createdAt: Date; filas: number; importados: number; errores: number } | null

  return {
    total,
    importaciones,
    ultimaImportacion: u ? { fecha: u.createdAt, filas: u.filas, importados: u.importados, errores: u.errores } : null,
  }
}

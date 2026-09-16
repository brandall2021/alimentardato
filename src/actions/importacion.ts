'use server'

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-guard'
import { importarExcelSchema, importarSIUSchema, validarImportacionRows } from '@/lib/validations'
import { revalidatePath } from 'next/cache'

type TipoDocumento = 'DNI' | 'LE' | 'LC' | 'PASAPORTE' | 'DNT' | 'CI' | 'CUIT_CUIL' | 'CM' | 'CD' | 'CC' | 'CDI'

function detectarTipoDocumento(val: string): TipoDocumento {
  const v = val.toUpperCase().trim()
  if (v === 'LE' || v === 'LC' || v === 'PASAPORTE') return v
  return 'DNI'
}

function parseNumeroDocumento(val: string): string {
  return val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
}

function limpiarString(val: unknown): string | null {
  if (val === null || val === undefined) return null
  const s = String(val).trim()
  return s || null
}

function limpiarNumero(val: unknown): number | null {
  if (val === null || val === undefined) return null
  const n = Number(val)
  return isNaN(n) ? null : n
}

function parseDate(val: unknown): Date | null {
  if (val === null || val === undefined) return null
  if (val instanceof Date) return val

  const s = String(val).trim()
  if (!s) return null

  const d = new Date(s)
  if (!isNaN(d.getTime())) return d

  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (m) {
    const d2 = new Date(+m[3], +m[2] - 1, +m[1])
    if (!isNaN(d2.getTime())) return d2
  }

  const m2 = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (m2) {
    const d3 = new Date(+m2[1], +m2[2] - 1, +m2[3])
    if (!isNaN(d3.getTime())) return d3
  }

  return null
}

export interface ResultadoImportacion {
  fila: number
  exito: boolean
  error?: string
}

export async function importarDesdeExcel(base64: string): Promise<{
  importados: number
  errores: number
  detalles: ResultadoImportacion[]
}> {
  await requireAdmin()
  importarExcelSchema.parse(base64)
  const XLSX = await import('xlsx')

  const buf = Buffer.from(base64, 'base64')
  const wb = XLSX.read(buf, { type: 'buffer' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: null })
  validarImportacionRows(rows.length)

  const resultados: ResultadoImportacion[] = []
  let ok = 0
  let err = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const fila = i + 2

    try {
      const apellidoNombre = limpiarString(row['Apellido y Nombre'] ?? row['apellido_nombre'] ?? row['nombre_completo'])
      if (!apellidoNombre) {
        resultados.push({ fila, exito: false, error: 'Falta Apellido y Nombre' })
        err++
        continue
      }

      const tipoDocRaw = limpiarString(row['Tipo Documento'] ?? row['tipo_documento'] ?? row['tipo_doc'])
      const tipoDocumento = detectarTipoDocumento(tipoDocRaw ?? '')

      const numDocRaw = limpiarString(row['N° Documento'] ?? row['numero_documento'] ?? row['nro_documento'] ?? row['documento'])
      const numeroDocumento = parseNumeroDocumento(numDocRaw ?? '')

      if (!numeroDocumento) {
        resultados.push({ fila, exito: false, error: 'Falta N° Documento' })
        err++
        continue
      }

      const data = {
        apellidoNombre,
        tipoDocumento: tipoDocumento as TipoDocumento,
        numeroDocumento,
        fechaNacimiento: parseDate(row['Fecha de Nacimiento'] ?? row['fecha_nacimiento'] ?? row['fecha_nac']),
        email: limpiarString(row['Email'] ?? row['email']),
        telefono: limpiarString(row['Teléfono'] ?? row['telefono'] ?? row['celular']),
        legajo: limpiarString(row['Legajo'] ?? row['legajo']),
        plan: limpiarString(row['Plan'] ?? row['plan']),
        anoIngreso: limpiarNumero(row['Año Ingreso'] ?? row['ano_ingreso'] ?? row['anio_ingreso']),
        fechaIngreso: parseDate(row['Fecha Ingreso'] ?? row['fecha_ingreso']),
        ultimoExamen: parseDate(row['Último Examen'] ?? row['ultimo_examen']),
        ultimaReinscripcion: parseDate(row['Última Reinscripción'] ?? row['ultima_reinscripcion']),
        promConAplazos: limpiarNumero(row['Prom. con Aplazos'] ?? row['prom_con_aplazos']),
        promSinAplazos: limpiarNumero(row['Prom. sin Aplazos'] ?? row['prom_sin_aplazos']),
        actividadesAprobadas: limpiarNumero(row['Actividades Aprobadas'] ?? row['actividades_aprobadas']),
        totalActividades: limpiarNumero(row['Total Actividades'] ?? row['total_actividades']),
        estadoInscripcion: limpiarString(row['Estado inscripción'] ?? row['estado_inscripcion']),
        paisOrigen: limpiarString(row['País de Origen'] ?? row['pais_origen']),
      }

      await prisma.alumno.upsert({
        where: {
          tipoDocumento_numeroDocumento: {
            tipoDocumento: tipoDocumento as TipoDocumento,
            numeroDocumento,
          },
        },
        create: data,
        update: data,
      })

      resultados.push({ fila, exito: true })
      ok++
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error desconocido'
      resultados.push({ fila, exito: false, error: msg })
      err++
    }
  }

  revalidatePath('/admin/alumnos')
  return { importados: ok, errores: err, detalles: resultados }
}

const TIPO_DOC_SIU: Record<string, TipoDocumento> = {
  '0': 'DNI',
  '1': 'DNT',
  '2': 'CI',
  '18': 'LE',
  '19': 'LC',
  '20': 'CM',
  '21': 'CD',
  '22': 'CC',
  '23': 'CDI',
  '90': 'PASAPORTE',
}

function parsearSIU(base64: string): string[] {
  return Buffer.from(base64, 'base64')
    .toString('utf-8')
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0)
}

function parsearAlumnosSIU(lineas: string[]) {
  return lineas
    .map((linea, i) => {
      const f = linea.split('|')
      if (f.length < 8) return null
      const numDoc = f[3]?.trim()
      if (!numDoc) return null
      return {
        tipoDocumento: (TIPO_DOC_SIU[f[5]?.trim()] ?? 'DNI') as TipoDocumento,
        numeroDocumento: numDoc,
        apellidoNombre: `${f[0] ?? ''} ${f[1] ?? ''}`.trim(),
        sexo: parseInt(f[2] ?? '') || null,
        cuit: f[4]?.trim() || null,
        fechaNacimiento: parsearFechaSIU(f[6]),
        legajo: f[7]?.trim() || null,
        plan: f[8]?.trim() || null,
        anoIngreso: parseInt(f[9] ?? '') || null,
        estadoInscripcion: f[10]?.trim() || null,
        telefono: [f[13]?.trim(), f[14]?.trim()]
          .filter((v) => v && v !== '99999999' && v !== '99999')
          .join(' ') || null,
      }
    })
    .filter(Boolean) as Array<{
    tipoDocumento: TipoDocumento
    numeroDocumento: string
    apellidoNombre: string
    sexo: number | null
    cuit: string | null
    fechaNacimiento: Date | null
    legajo: string | null
    plan: string | null
    anoIngreso: number | null
    estadoInscripcion: string | null
    telefono: string | null
  }>
}

function parsearInscripcionesSIU(lineas: string[]) {
  return lineas
    .map((linea) => {
      const f = linea.split('|')
      if (f.length < 8) return null
      const numDoc = f[1]?.trim()
      if (!numDoc) return null
      const fechaStr = f[6]?.trim()
      if (!fechaStr || fechaStr.length < 8) return null
      return {
        tipoDocumento: (TIPO_DOC_SIU[f[0]?.trim()] ?? 'DNI') as TipoDocumento,
        numeroDocumento: numDoc,
        cuit: f[2]?.trim() || null,
        planCodigo: parseInt(f[3] ?? '') || 0,
        sedeCodigo: parseInt(f[4] ?? '') || 0,
        anio: parseInt(f[5] ?? '') || 0,
        fecha: parsearFechaSIU(fechaStr),
        turno: parseInt(f[7] ?? '') || null,
        regularidad: f[11]?.trim() || null,
      }
    })
    .filter(Boolean) as Array<{
    tipoDocumento: TipoDocumento
    numeroDocumento: string
    cuit: string | null
    planCodigo: number
    sedeCodigo: number
    anio: number
    fecha: Date
    turno: number | null
    regularidad: string | null
  }>
}

function parsearExamenesSIU(lineas: string[]) {
  return lineas
    .map((linea) => {
      const f = linea.split('|')
      if (f.length < 15) return null
      const numDoc = f[1]?.trim()
      if (!numDoc) return null
      const fechaStr = f[5]?.trim()
      if (!fechaStr || fechaStr.length < 8) return null
      return {
        tipoDocumento: (TIPO_DOC_SIU[f[0]?.trim()] ?? 'DNI') as TipoDocumento,
        numeroDocumento: numDoc,
        cuit: f[2]?.trim() || null,
        planCodigo: parseInt(f[3] ?? '') || 0,
        sedeCodigo: parseInt(f[4] ?? '') || 0,
        fechaExamen: parsearFechaSIU(fechaStr),
        turno: parseInt(f[6] ?? '') || null,
        materiaCodigo: f[7]?.trim() ?? '',
        materiaNombre: f[8]?.trim() ?? '',
        cargaHoraria: parseInt(f[9] ?? '') || null,
        aprobadas: parseInt(f[10] ?? '') || null,
        totalMaterias: parseInt(f[11] ?? '') || null,
        periodo: f[13]?.trim() || null,
        actaCodigo: f[14]?.trim() || null,
        numeroActa: f[15]?.trim() || null,
      }
    })
    .filter(Boolean) as Array<{
    tipoDocumento: TipoDocumento
    numeroDocumento: string
    cuit: string | null
    planCodigo: number
    sedeCodigo: number
    fechaExamen: Date
    turno: number | null
    materiaCodigo: string
    materiaNombre: string
    cargaHoraria: number | null
    aprobadas: number | null
    totalMaterias: number | null
    periodo: string | null
    actaCodigo: string | null
    numeroActa: string | null
  }>
}

function parsearFechaSIU(s: string): Date {
  const v = s?.trim()
  if (!v || v.length < 8) return new Date(0)
  return new Date(+v.slice(0, 4), +v.slice(4, 6) - 1, +v.slice(6, 8))
}

const BATCH = 500

export async function importarDesdeSIU(archivos: {
  archivo0: string
  archivo1: string
  archivo2: string
  archivo3: string
}): Promise<{
  alumnos: number
  inscripciones: number
  examenes: number
  materias: number
  errores: number
}> {
  await requireAdmin()
  importarSIUSchema.parse(archivos)

  const lineas0 = parsearSIU(archivos.archivo0)
  const lineas1 = parsearSIU(archivos.archivo1)
  const lineas2 = parsearSIU(archivos.archivo2)
  const lineas3 = parsearSIU(archivos.archivo3)

  const alumnosRaw = parsearAlumnosSIU(lineas0)
  const inscripcionesRaw = parsearInscripcionesSIU(lineas1)
  const examenesRaw = [...parsearExamenesSIU(lineas2), ...parsearExamenesSIU(lineas3)]

  let alumnosOk = 0
  let inscripcionesOk = 0
  let examenesOk = 0
  let materiasOk = 0
  let errores = 0

  for (let i = 0; i < alumnosRaw.length; i += BATCH) {
    try {
      const batch = alumnosRaw.slice(i, i + BATCH)
      const r = await prisma.alumno.createMany({ data: batch, skipDuplicates: true })
      alumnosOk += r.count
    } catch {
      errores += Math.min(BATCH, alumnosRaw.length - i)
    }
  }

  const alumnos = await prisma.alumno.findMany({
    select: { id: true, numeroDocumento: true, tipoDocumento: true },
  })
  const alumnoMap = new Map(alumnos.map((a) => [a.numeroDocumento, a]))

  const inscripcionesData = inscripcionesRaw
    .map((raw) => {
      const alumno = alumnoMap.get(raw.numeroDocumento)
      if (!alumno) return null
      return {
        alumnoId: alumno.id,
        tipoDocumento: alumno.tipoDocumento,
        numeroDocumento: raw.numeroDocumento,
        cuit: raw.cuit,
        planCodigo: raw.planCodigo,
        sedeCodigo: raw.sedeCodigo,
        anio: raw.anio,
        fecha: raw.fecha,
        turno: raw.turno,
        regularidad: raw.regularidad,
      }
    })
    .filter(Boolean) as Array<{
    alumnoId: string
    tipoDocumento: TipoDocumento
    numeroDocumento: string
    cuit: string | null
    planCodigo: number
    sedeCodigo: number
    anio: number
    fecha: Date
    turno: number | null
    regularidad: string | null
  }>

  for (let i = 0; i < inscripcionesData.length; i += BATCH) {
    try {
      const batch = inscripcionesData.slice(i, i + BATCH)
      const r = await prisma.inscripcion.createMany({ data: batch, skipDuplicates: true })
      inscripcionesOk += r.count
    } catch {
      errores += Math.min(BATCH, inscripcionesData.length - i)
    }
  }

  const materiasMap = new Map<string, { codigo: string; nombre: string; cargaHoraria: number | null }>()
  for (const e of examenesRaw) {
    if (e.materiaCodigo && !materiasMap.has(e.materiaCodigo)) {
      materiasMap.set(e.materiaCodigo, {
        codigo: e.materiaCodigo,
        nombre: e.materiaNombre,
        cargaHoraria: e.cargaHoraria,
      })
    }
  }

  const materiasArray = Array.from(materiasMap.values())
  for (let i = 0; i < materiasArray.length; i += BATCH) {
    try {
      const batch = materiasArray.slice(i, i + BATCH)
      const r = await prisma.materia.createMany({ data: batch, skipDuplicates: true })
      materiasOk += r.count
    } catch {
      errores += Math.min(BATCH, materiasArray.length - i)
    }
  }

  const examenesData = examenesRaw
    .map((raw) => {
      const alumno = alumnoMap.get(raw.numeroDocumento)
      if (!alumno) return null
      return {
        alumnoId: alumno.id,
        tipoDocumento: alumno.tipoDocumento,
        numeroDocumento: raw.numeroDocumento,
        cuit: raw.cuit,
        planCodigo: raw.planCodigo,
        sedeCodigo: raw.sedeCodigo,
        fechaExamen: raw.fechaExamen,
        turno: raw.turno,
        materiaCodigo: raw.materiaCodigo,
        materiaNombre: raw.materiaNombre,
        cargaHoraria: raw.cargaHoraria,
        aprobadas: raw.aprobadas,
        totalMaterias: raw.totalMaterias,
        periodo: raw.periodo,
        actaCodigo: raw.actaCodigo,
        numeroActa: raw.numeroActa,
      }
    })
    .filter(Boolean) as Array<{
    alumnoId: string
    tipoDocumento: TipoDocumento
    numeroDocumento: string
    cuit: string | null
    planCodigo: number
    sedeCodigo: number
    fechaExamen: Date
    turno: number | null
    materiaCodigo: string
    materiaNombre: string
    cargaHoraria: number | null
    aprobadas: number | null
    totalMaterias: number | null
    periodo: string | null
    actaCodigo: string | null
    numeroActa: string | null
  }>

  for (let i = 0; i < examenesData.length; i += BATCH) {
    try {
      const batch = examenesData.slice(i, i + BATCH)
      const r = await prisma.examen.createMany({ data: batch, skipDuplicates: true })
      examenesOk += r.count
    } catch {
      errores += Math.min(BATCH, examenesData.length - i)
    }
  }

  revalidatePath('/admin/alumnos')
  return {
    alumnos: alumnosOk,
    inscripciones: inscripcionesOk,
    examenes: examenesOk,
    materias: materiasOk,
    errores,
  }
}

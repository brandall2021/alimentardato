'use server'

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-guard'
import { importarExcelSchema, validarImportacionRows } from '@/lib/validations'
import { revalidatePath } from 'next/cache'
import type { MapeoColumnas, CampoAlumno } from '@/lib/campos-alumno'

type TipoDocumento = 'DNI' | 'LE' | 'LC' | 'PASAPORTE'

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

const ALIASES: Record<string, CampoAlumno> = {
  'apellido y nombre': 'apellidoNombre',
  'apellido_nombre': 'apellidoNombre',
  'nombre_completo': 'apellidoNombre',
  'tipo documento': 'tipoDocumento',
  'tipo_documento': 'tipoDocumento',
  'tipo_doc': 'tipoDocumento',
  'n° documento': 'numeroDocumento',
  'nro documento': 'numeroDocumento',
  'numero_documento': 'numeroDocumento',
  'nro_documento': 'numeroDocumento',
  'documento': 'numeroDocumento',
  'fecha de nacimiento': 'fechaNacimiento',
  'fecha_nacimiento': 'fechaNacimiento',
  'fecha_nac': 'fechaNacimiento',
  'email': 'email',
  'teléfono': 'telefono',
  'telefono': 'telefono',
  'celular': 'telefono',
  'legajo': 'legajo',
  'plan': 'plan',
  'año ingreso': 'anoIngreso',
  'ano ingreso': 'anoIngreso',
  'ano_ingreso': 'anoIngreso',
  'anio_ingreso': 'anoIngreso',
  'fecha ingreso': 'fechaIngreso',
  'fecha_ingreso': 'fechaIngreso',
  'último examen': 'ultimoExamen',
  'ultimo_examen': 'ultimoExamen',
  'última reinscripción': 'ultimaReinscripcion',
  'ultima_reinscripcion': 'ultimaReinscripcion',
  'prom. con aplazos': 'promConAplazos',
  'prom_con_aplazos': 'promConAplazos',
  'prom. sin aplazos': 'promSinAplazos',
  'prom_sin_aplazos': 'promSinAplazos',
  'actividades aprobadas': 'actividadesAprobadas',
  'actividades_aprobadas': 'actividadesAprobadas',
  'total actividades': 'totalActividades',
  'total_actividades': 'totalActividades',
  'estado inscripción': 'estadoInscripcion',
  'estado_inscripcion': 'estadoInscripcion',
  'país de origen': 'paisOrigen',
  'pais_origen': 'paisOrigen',
}

function detectarCampo(columna: string): CampoAlumno | null {
  const key = columna.toLowerCase().trim().replace(/\s+/g, ' ')
  return ALIASES[key] ?? null
}

export interface ResultadoImportacion {
  fila: number
  exito: boolean
  error?: string
}

async function leerWorkbook(base64: string) {
  const XLSX = await import('xlsx')
  const buf = Buffer.from(base64, 'base64')
  const wb = XLSX.read(buf, { type: 'buffer' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null })
}

export async function leerEncabezadosExcel(base64: string): Promise<string[]> {
  await requireAdmin()
  importarExcelSchema.parse(base64)
  const rows = await leerWorkbook(base64)
  if (rows.length === 0) return []
  return Object.keys(rows[0])
}

export async function importarDesdeExcel(
  base64: string,
  mapeo?: MapeoColumnas
): Promise<{
  importados: number
  errores: number
  detalles: ResultadoImportacion[]
}> {
  await requireAdmin()
  importarExcelSchema.parse(base64)
  const rows = await leerWorkbook(base64)
  validarImportacionRows(rows.length)

  const resultados: ResultadoImportacion[] = []
  let ok = 0
  let err = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const fila = i + 2

    try {
      const resolver = (campo: CampoAlumno): unknown => {
        if (mapeo) {
          const columna = Object.entries(mapeo).find(([, c]) => c === campo)?.[0]
          return columna ? row[columna] : undefined
        }
        return undefined
      }

      let apellidoNombre: string | null
      if (mapeo) {
        apellidoNombre = limpiarString(resolver('apellidoNombre'))
      } else {
        apellidoNombre = limpiarString(
          row['Apellido y Nombre'] ?? row['apellido_nombre'] ?? row['nombre_completo']
        )
      }
      if (!apellidoNombre) {
        resultados.push({ fila, exito: false, error: 'Falta Apellido y Nombre' })
        err++
        continue
      }

      let tipoDocumento: TipoDocumento
      let numeroDocumento: string

      if (mapeo) {
        const td = limpiarString(resolver('tipoDocumento'))
        tipoDocumento = detectarTipoDocumento(td ?? '')
        const nd = limpiarString(resolver('numeroDocumento'))
        numeroDocumento = parseNumeroDocumento(nd ?? '')
      } else {
        const td = limpiarString(row['Tipo Documento'] ?? row['tipo_documento'] ?? row['tipo_doc'])
        tipoDocumento = detectarTipoDocumento(td ?? '')
        const nd = limpiarString(row['N° Documento'] ?? row['numero_documento'] ?? row['nro_documento'] ?? row['documento'])
        numeroDocumento = parseNumeroDocumento(nd ?? '')
      }

      if (!numeroDocumento) {
        resultados.push({ fila, exito: false, error: 'Falta N° Documento' })
        err++
        continue
      }

      const mapeados = new Set(Object.values(mapeo ?? {}).filter(Boolean) as CampoAlumno[])

      const REQ = new Set<CampoAlumno>(['apellidoNombre', 'tipoDocumento', 'numeroDocumento'])
      const incluir = (campo: CampoAlumno): boolean => REQ.has(campo) || !mapeo || mapeados.has(campo)

      const fields: [CampoAlumno, () => unknown][] = [
        ['apellidoNombre', () => apellidoNombre],
        ['tipoDocumento', () => tipoDocumento],
        ['numeroDocumento', () => numeroDocumento],
        ['fechaNacimiento', () => parseDate(mapeo ? resolver('fechaNacimiento') : row['Fecha de Nacimiento'] ?? row['fecha_nacimiento'] ?? row['fecha_nac'])],
        ['email', () => limpiarString(mapeo ? resolver('email') : row['Email'] ?? row['email'])],
        ['telefono', () => limpiarString(mapeo ? resolver('telefono') : row['Teléfono'] ?? row['telefono'] ?? row['celular'])],
        ['legajo', () => limpiarString(mapeo ? resolver('legajo') : row['Legajo'] ?? row['legajo'])],
        ['plan', () => limpiarString(mapeo ? resolver('plan') : row['Plan'] ?? row['plan'])],
        ['anoIngreso', () => limpiarNumero(mapeo ? resolver('anoIngreso') : row['Año Ingreso'] ?? row['ano_ingreso'] ?? row['anio_ingreso'])],
        ['fechaIngreso', () => parseDate(mapeo ? resolver('fechaIngreso') : row['Fecha Ingreso'] ?? row['fecha_ingreso'])],
        ['ultimoExamen', () => parseDate(mapeo ? resolver('ultimoExamen') : row['Último Examen'] ?? row['ultimo_examen'])],
        ['ultimaReinscripcion', () => parseDate(mapeo ? resolver('ultimaReinscripcion') : row['Última Reinscripción'] ?? row['ultima_reinscripcion'])],
        ['promConAplazos', () => limpiarNumero(mapeo ? resolver('promConAplazos') : row['Prom. con Aplazos'] ?? row['prom_con_aplazos'])],
        ['promSinAplazos', () => limpiarNumero(mapeo ? resolver('promSinAplazos') : row['Prom. sin Aplazos'] ?? row['prom_sin_aplazos'])],
        ['actividadesAprobadas', () => limpiarNumero(mapeo ? resolver('actividadesAprobadas') : row['Actividades Aprobadas'] ?? row['actividades_aprobadas'])],
        ['totalActividades', () => limpiarNumero(mapeo ? resolver('totalActividades') : row['Total Actividades'] ?? row['total_actividades'])],
        ['estadoInscripcion', () => limpiarString(mapeo ? resolver('estadoInscripcion') : row['Estado inscripción'] ?? row['estado_inscripcion'])],
        ['paisOrigen', () => limpiarString(mapeo ? resolver('paisOrigen') : row['País de Origen'] ?? row['pais_origen'])],
      ]

      const data: Record<string, unknown> = {}
      for (const [campo, fn] of fields) {
        if (incluir(campo)) {
          data[campo] = fn()
        }
      }

      await prisma.alumno.upsert({
        where: {
          tipoDocumento_numeroDocumento: {
            tipoDocumento: tipoDocumento as TipoDocumento,
            numeroDocumento,
          },
        },
        create: data as never,
        update: data as never,
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

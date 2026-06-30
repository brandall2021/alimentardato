'use server'

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-guard'
import { importarExcelSchema, validarImportacionRows } from '@/lib/validations'
import { revalidatePath } from 'next/cache'

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

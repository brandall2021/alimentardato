'use server'

import { prisma } from '@/lib/prisma'
import { Prisma } from '@/generated/prisma/client'

function detectarTipo(valor: string): 'documento' | 'legajo' | 'email' | 'desconocido' {
  const trimmed = valor.trim()

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'email'

  if (/^\d{7,8}$/.test(trimmed)) return 'documento'

  if (/^[\d-]+$/.test(trimmed) && trimmed.length >= 3 && trimmed.length <= 20) return 'legajo'

  if (/^[A-Z]{2,3}\d+$/i.test(trimmed)) return 'documento'

  return 'desconocido'
}

export interface ResultadoBusqueda {
  valor: string
  tipo: string
  apellidoNombre: string | null
  email: string | null
  telefono: string | null
  encontrado: boolean
}

export async function buscarPorValores(valoresRaw: string): Promise<ResultadoBusqueda[]> {
  const valores = valoresRaw
    .split(/[\n,;\t]+/)
    .map((v) => v.trim())
    .filter(Boolean)

  const resultados: ResultadoBusqueda[] = []

  for (const valor of valores) {
    const tipo = detectarTipo(valor)

    if (tipo === 'desconocido') {
      resultados.push({
        valor,
        tipo: 'desconocido',
        apellidoNombre: null,
        email: null,
        telefono: null,
        encontrado: false,
      })
      continue
    }

    let where: Prisma.AlumnoWhereInput

    if (tipo === 'email') {
      where = { email: { equals: valor, mode: 'insensitive' } }
    } else if (tipo === 'documento') {
      where = { numeroDocumento: { equals: valor, mode: 'insensitive' } }
    } else {
      where = { legajo: { equals: valor, mode: 'insensitive' } }
    }

    const alumnos = await prisma.alumno.findMany({
      where,
      select: {
        apellidoNombre: true,
        email: true,
        telefono: true,
        numeroDocumento: true,
        legajo: true,
      },
    })

    if (alumnos.length === 0) {
      resultados.push({
        valor,
        tipo,
        apellidoNombre: null,
        email: null,
        telefono: null,
        encontrado: false,
      })
    } else {
      for (const a of alumnos) {
        resultados.push({
          valor,
          tipo,
          apellidoNombre: a.apellidoNombre,
          email: a.email,
          telefono: a.telefono,
          encontrado: true,
        })
      }
    }
  }

  return resultados
}

export interface FiltrosAvanzados {
  plan?: string
  anoIngreso?: number
  estadoInscripcion?: string
}

export async function buscarPorFiltros(filtros: FiltrosAvanzados): Promise<ResultadoBusqueda[]> {
  const where: Prisma.AlumnoWhereInput = {}

  if (filtros.plan) where.plan = { contains: filtros.plan, mode: 'insensitive' }
  if (filtros.anoIngreso) where.anoIngreso = filtros.anoIngreso
  if (filtros.estadoInscripcion) {
    where.estadoInscripcion = { contains: filtros.estadoInscripcion, mode: 'insensitive' }
  }

  const alumnos = await prisma.alumno.findMany({
    where,
    select: {
      apellidoNombre: true,
      email: true,
      telefono: true,
      numeroDocumento: true,
      legajo: true,
    },
    orderBy: { apellidoNombre: 'asc' },
  })

  return alumnos.map((a) => ({
    valor: a.legajo ?? a.numeroDocumento ?? '',
    tipo: 'filtro',
    apellidoNombre: a.apellidoNombre,
    email: a.email,
    telefono: a.telefono,
    encontrado: true,
  }))
}

export async function exportarResultados(resultados: ResultadoBusqueda[]) {
  const XLSX = await import('xlsx')

  const data = resultados.map((r) => ({
    'Valor buscado': r.valor,
    'Apellido y Nombre': r.apellidoNombre ?? '(no encontrado)',
    Email: r.email ?? '',
    Teléfono: r.telefono ?? '',
  }))

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(data)
  XLSX.utils.book_append_sheet(wb, ws, 'Resultados')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return buf.toString('base64')
}

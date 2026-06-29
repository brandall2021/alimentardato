'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { Prisma } from '@/generated/prisma/client'

function detectarTipo(valor: string): 'documento' | 'legajo' | 'email' | 'desconocido' {
  const trimmed = valor.trim()

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'email'

  if (/^\d{7,8}$/.test(trimmed)) return 'documento'

  if (/^[\d-]+$/.test(trimmed) && trimmed.length >= 3 && trimmed.length <= 20) return 'legajo'

  if (/^[A-Z]{2,3}\d+$/i.test(trimmed)) return 'documento'

  return 'desconocido'
}

async function registrarConsulta(opts: {
  tipo: string
  valores: string
  resultados: number
  filtros?: string
}) {
  try {
    const session = await auth()
    await prisma.consulta.create({
      data: {
        usuario: session?.user?.email ?? session?.user?.name ?? 'anónimo',
        email: session?.user?.email ?? null,
        tipo: opts.tipo,
        valores: opts.valores,
        resultados: opts.resultados,
        filtros: opts.filtros ?? null,
      },
    })
  } catch {
    // no romper la búsqueda si falla el log
  }
}

export interface ResultadoBusqueda {
  id: string
  valor: string
  tipo: string
  apellidoNombre: string | null
  email: string | null
  telefono: string | null
  encontrado: boolean
}

export async function actualizarContacto(id: string, email?: string | null, telefono?: string | null) {
  const data: Record<string, string | null> = {}
  if (email !== undefined) data.email = email
  if (telefono !== undefined) data.telefono = telefono
  await prisma.alumno.update({
    where: { id },
    data,
  })
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
        id: '',
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
        id: true,
        apellidoNombre: true,
        email: true,
        telefono: true,
        numeroDocumento: true,
        legajo: true,
      },
    })

    if (alumnos.length === 0) {
      resultados.push({
        id: '',
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
          id: a.id,
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

  registrarConsulta({
    tipo: 'valores',
    valores: valoresRaw,
    resultados: resultados.filter((r) => r.encontrado).length,
  })

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
      id: true,
      apellidoNombre: true,
      email: true,
      telefono: true,
      numeroDocumento: true,
      legajo: true,
    },
    orderBy: { apellidoNombre: 'asc' },
  })

  const resultados = alumnos.map((a) => ({
    id: a.id,
    valor: a.legajo ?? a.numeroDocumento ?? '',
    tipo: 'filtro',
    apellidoNombre: a.apellidoNombre,
    email: a.email,
    telefono: a.telefono,
    encontrado: true,
  }))

  registrarConsulta({
    tipo: 'filtros',
    valores: '',
    resultados: resultados.length,
    filtros: JSON.stringify(filtros),
  })

  return resultados
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

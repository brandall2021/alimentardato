'use server'

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-guard'
import { paginacionSchema } from '@/lib/validations'

export async function listarConsultas(pagina = 1, porPagina = 50) {
  await requireAdmin()
  paginacionSchema.parse({ pagina, porPagina })
  const [consultas, total] = await Promise.all([
    prisma.consulta.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (pagina - 1) * porPagina,
      take: porPagina,
    }),
    prisma.consulta.count(),
  ])

  return { consultas, total, paginas: Math.ceil(total / porPagina) }
}

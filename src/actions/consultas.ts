'use server'

import { prisma } from '@/lib/prisma'

export async function listarConsultas(pagina = 1, porPagina = 50) {
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

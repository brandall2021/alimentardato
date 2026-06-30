'use server'

import { prisma } from '@/lib/prisma'

export async function obtenerConfig() {
  const rows = await prisma.configuracion.findMany()
  const map: Record<string, string> = {}
  for (const r of rows) map[r.clave] = r.valor
  return map
}

export async function guardarConfig(clave: string, valor: string) {
  await prisma.configuracion.upsert({
    where: { clave },
    create: { clave, valor },
    update: { valor },
  })
}

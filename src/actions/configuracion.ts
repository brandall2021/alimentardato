'use server'

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-guard'
import bcrypt from 'bcryptjs'

const CLAVES_SENSIBLES = ['dev_password']

export async function obtenerConfig() {
  await requireAdmin()
  const rows = await prisma.configuracion.findMany()
  const map: Record<string, string> = {}
  for (const r of rows) {
    if (CLAVES_SENSIBLES.includes(r.clave)) continue
    map[r.clave] = r.valor
  }
  return map
}

export async function guardarConfig(clave: string, valor: string) {
  await requireAdmin()
  let valorFinal = valor
  if (clave === 'dev_password' && valor) {
    valorFinal = await bcrypt.hash(valor, 12)
  }
  await prisma.configuracion.upsert({
    where: { clave },
    create: { clave, valor: valorFinal },
    update: { valor: valorFinal },
  })
}

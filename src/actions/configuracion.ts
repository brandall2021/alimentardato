'use server'

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-guard'
import bcrypt from 'bcryptjs'

const CLAVES_SENSIBLES = ['dev_password', 'openai_api_key', 'chatbot_prompt']

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

export async function obtenerOpenAIKey() {
  try {
    const row = await prisma.configuracion.findUnique({
      where: { clave: 'openai_api_key' },
    })
    return row?.valor ?? null
  } catch {
    return null
  }
}

export async function guardarOpenAIKey(key: string) {
  await requireAdmin()
  const trimmed = key.trim()
  await prisma.configuracion.upsert({
    where: { clave: 'openai_api_key' },
    create: { clave: 'openai_api_key', valor: trimmed },
    update: { valor: trimmed },
  })
  await prisma.configuracion.upsert({
    where: { clave: 'openai_api_key_set' },
    create: { clave: 'openai_api_key_set', valor: 'true' },
    update: { valor: 'true' },
  })
}

export async function obtenerPrompt() {
  try {
    const row = await prisma.configuracion.findUnique({
      where: { clave: 'chatbot_prompt' },
    })
    return row?.valor ?? null
  } catch {
    return null
  }
}

export async function guardarPrompt(prompt: string) {
  await requireAdmin()
  await prisma.configuracion.upsert({
    where: { clave: 'chatbot_prompt' },
    create: { clave: 'chatbot_prompt', valor: prompt },
    update: { valor: prompt },
  })
}

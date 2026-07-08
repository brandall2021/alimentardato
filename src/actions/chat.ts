'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getTablesList as getTables } from '@/lib/db-schema'


export async function listChatSessions() {
  const session = await auth()
  if (!session?.user?.id) return []

  const sessions = await prisma.chatSession.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      updatedAt: true,
      _count: { select: { messages: true } },
    },
  })
  return sessions
}

export async function getChatSession(id: string) {
  const s = await auth()
  if (!s?.user?.id) return null

  const chat = await prisma.chatSession.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
    },
  })
  if (!chat || chat.userId !== s.user.id) return null
  return chat
}

export async function createChatSession(title?: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autorizado')

  const chat = await prisma.chatSession.create({
    data: {
      title: title ?? 'Nueva consulta',
      userId: session.user.id,
    },
  })
  return chat
}

export async function deleteChatSession(id: string) {
  const s = await auth()
  if (!s?.user?.id) throw new Error('No autorizado')

  const chat = await prisma.chatSession.findUnique({ where: { id } })
  if (!chat || chat.userId !== s.user.id) throw new Error('No autorizado')

  await prisma.chatSession.delete({ where: { id } })
}

export async function updateChatSessionTitle(id: string, title: string) {
  const s = await auth()
  if (!s?.user?.id) throw new Error('No autorizado')

  const chat = await prisma.chatSession.findUnique({ where: { id } })
  if (!chat || chat.userId !== s.user.id) throw new Error('No autorizado')

  await prisma.chatSession.update({ where: { id }, data: { title } })
}

export async function saveChatMessage(
  sessionId: string,
  msg: {
    role: string
    content: string
    sql?: string | null
    data?: unknown[] | null
    columns?: string | null
    rowCount?: number | null
    error?: string | null
  }
) {
  const s = await auth()
  if (!s?.user?.id) throw new Error('No autorizado')

  const chat = await prisma.chatSession.findUnique({ where: { id: sessionId } })
  if (!chat || chat.userId !== s.user.id) throw new Error('No autorizado')

  const message = await prisma.chatMessage.create({
    data: {
      sessionId,
      role: msg.role,
      content: msg.content,
      sql: msg.sql ?? null,
      data: msg.data ? JSON.parse(JSON.stringify(msg.data)) : undefined,
      columns: msg.columns ?? null,
      rowCount: msg.rowCount ?? null,
      error: msg.error ?? null,
    },
  })

  await prisma.chatSession.update({
    where: { id: sessionId },
    data: { updatedAt: new Date() },
  })

  return message
}

export async function getTablesList() {
  const s = await auth()
  if (!s?.user?.id) return []
  return getTables()
}

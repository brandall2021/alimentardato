import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

async function checkAuth() {
  const session = await auth()
  if (!session?.user?.id) {
    return null
  }
  return session
}

export async function GET() {
  const session = await checkAuth()
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const notificaciones = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const noLeidas = notificaciones.filter((n) => !n.read).length

  return NextResponse.json({ notificaciones, noLeidas })
}

export async function PATCH(req: Request) {
  const session = await checkAuth()
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id } = await req.json()

  if (id === 'todas') {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, read: false },
      data: { read: true },
    })
  } else {
    await prisma.notification.updateMany({
      where: { id, userId: session.user.id },
      data: { read: true },
    })
  }

  return NextResponse.json({ success: true })
}
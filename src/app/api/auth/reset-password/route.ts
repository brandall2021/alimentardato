import { NextResponse } from 'next/server'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const { token, password } = await req.json()

  if (!token || !password || password.length < 6) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

  const user = await prisma.user.findFirst({
    where: {
      resetToken: hashedToken,
      resetTokenExpiry: { gt: new Date() },
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 400 })
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  await prisma.$transaction([
    prisma.configuracion.upsert({
      where: { clave: 'dev_password' },
      create: { clave: 'dev_password', valor: hashedPassword },
      update: { valor: hashedPassword },
    }),
    prisma.configuracion.upsert({
      where: { clave: 'dev_password_set' },
      create: { clave: 'dev_password_set', valor: 'true' },
      update: { valor: 'true' },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: null,
        resetTokenExpiry: null,
      },
    }),
  ])

  return NextResponse.json({ message: 'Contraseña actualizada correctamente' })
}
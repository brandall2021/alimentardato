import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const { email } = await req.json()
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    return NextResponse.json({
      message: 'Si el email existe, recibirás un enlace de recuperación',
    })
  }

  const rawToken = crypto.randomBytes(32).toString('hex')
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex')

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken: hashedToken,
      resetTokenExpiry: new Date(Date.now() + 3600000),
    },
  })

  const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin/reset-password?token=${rawToken}`

  console.log(`[PASSWORD RESET] Enlace para ${email}: ${resetUrl}`)

  return NextResponse.json({
    message: 'Si el email existe, recibirás un enlace de recuperación',
    ...(process.env.NODE_ENV === 'development' && { resetUrl }),
  })
}
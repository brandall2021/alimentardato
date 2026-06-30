import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './prisma'

async function getDevCredentials() {
  const envEmail = process.env.DEV_EMAIL
  const envPassword = process.env.DEV_PASSWORD
  if (envEmail && envPassword) return { email: envEmail, password: envPassword }
  try {
    const dbEmail = await prisma.configuracion.findUnique({ where: { clave: 'dev_email' } })
    const dbPass = await prisma.configuracion.findUnique({ where: { clave: 'dev_password' } })
    if (dbEmail?.valor && dbPass?.valor) return { email: dbEmail.valor, password: dbPass.valor }
  } catch {}
  return null
}

const providers = []

const devCredentials = await getDevCredentials()

if (devCredentials) {
  const { email: devEmail, password: devPassword } = devCredentials
  providers.push(
    CredentialsProvider({
      name: 'Desarrollo',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (
          credentials?.email === devEmail &&
          credentials?.password === devPassword
        ) {
          return { id: 'dev', email: devEmail, name: 'Desarrollo' }
        }
        return null
      },
    })
  )
} else {
  providers.push(
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID ?? '',
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? '',
    })
  )
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  callbacks: {
    async signIn({ user }) {
      const creds = await getDevCredentials()
      if (creds && user.email === creds.email) return true
      const adminEmail = process.env.ADMIN_EMAIL
      const existing = await prisma.user.findUnique({
        where: { email: user.email! },
      })
      if (existing) return true
      if (user.email === adminEmail) return true
      return false
    },
    async session({ session, user }) {
      session.user.id = user.id
      session.user.role = (user as { role?: string }).role ?? 'ADMIN'
      return session
    },
  },
  pages: {
    signIn: '/admin/login',
  },
})

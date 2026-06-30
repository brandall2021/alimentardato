import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

async function getDevCredentials() {
  const envEmail = process.env.DEV_EMAIL
  const envPassword = process.env.DEV_PASSWORD
  if (envEmail && envPassword) return { email: envEmail, password: envPassword, hashed: false }
  try {
    const dbEmail = await prisma.configuracion.findUnique({ where: { clave: 'dev_email' } })
    const dbPass = await prisma.configuracion.findUnique({ where: { clave: 'dev_password' } })
    if (dbEmail?.valor && dbPass?.valor) return { email: dbEmail.valor, password: dbPass.valor, hashed: true }
  } catch {}
  return null
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Desarrollo',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        const creds = await getDevCredentials()
        if (!creds) return null
        if (credentials?.email !== creds.email) return null
        if (creds.hashed) {
          const ok = await bcrypt.compare(credentials?.password as string, creds.password)
          if (!ok) return null
        } else if (credentials?.password !== creds.password) {
          return null
        }
        return { id: 'dev', email: creds.email, name: 'Desarrollo' }
      },
    }),
  ],
  callbacks: {
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

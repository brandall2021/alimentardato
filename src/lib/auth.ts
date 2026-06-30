import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
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

export const { handlers, auth, signIn, signOut } = NextAuth({
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
        if (
          credentials?.email === creds.email &&
          credentials?.password === creds.password
        ) {
          return { id: 'dev', email: creds.email, name: 'Desarrollo' }
        }
        return null
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

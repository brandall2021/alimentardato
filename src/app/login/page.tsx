import { auth } from '@/lib/auth'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { LoginForm } from './login-form'

export default async function LoginPage() {
  const session = await auth()
  if (session) redirect('/admin')

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-white via-red-50 to-white px-4">
      <div className="mb-8 text-center">
        <Image
          src="/logo-face.png"
          alt="FACET"
          width={220}
          height={42}
          className="mx-auto h-10 w-auto"
          priority
        />
        <p className="mt-2 text-xs text-gray-400">
          Facultad de Ciencias Económicas · Universidad Nacional de Tucumán
        </p>
      </div>

      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-lg">
        <h1 className="mb-1 text-center text-xl font-heading font-bold text-gray-800">Alimentar Dato</h1>
        <p className="mb-6 text-center text-sm text-gray-400">Sistema de consulta de alumnos</p>

        <LoginForm />
      </div>

      <p className="mt-8 text-xs text-gray-300">© {new Date().getFullYear()} FACET · UNT</p>
    </div>
  )
}
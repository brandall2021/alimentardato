import { auth, signIn } from '@/lib/auth'
import Image from 'next/image'
import { redirect } from 'next/navigation'

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

        <form
          action={async (formData: FormData) => {
            'use server'
            await signIn('credentials', {
              email: formData.get('email'),
              password: formData.get('password'),
              redirectTo: '/admin/alumnos',
            })
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm transition focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm transition focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
          >
            Iniciar sesión
          </button>
        </form>
      </div>

      <p className="mt-8 text-xs text-gray-300">© {new Date().getFullYear()} FACET · UNT</p>
    </div>
  )
}

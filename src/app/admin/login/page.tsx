import { auth, signIn } from '@/lib/auth'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'

function OAuthButton({ provider, label, icon }: { provider: string; label: string; icon: string }) {
  return (
    <form
      action={async () => {
        'use server'
        await signIn(provider, { redirectTo: '/admin/alumnos' })
      }}
    >
      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
      >
        <span className="text-base">{icon}</span>
        {label}
      </button>
    </form>
  )
}

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

        <div className="space-y-3">
          <OAuthButton provider="google" label="Continuar con Google" icon="G" />
          <OAuthButton provider="github" label="Continuar con GitHub" icon="GH" />

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-gray-400">o con credenciales</span>
            </div>
          </div>

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
            <p className="text-center text-xs text-gray-400">
              <Link href="/admin/forgot-password" className="text-brand hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </p>
          </form>
        </div>
      </div>

      <p className="mt-8 text-xs text-gray-300">© {new Date().getFullYear()} FACET · UNT</p>
    </div>
  )
}

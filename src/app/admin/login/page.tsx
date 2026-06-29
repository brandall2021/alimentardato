import { auth, signIn } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function LoginPage() {
  const session = await auth()
  if (session) redirect('/admin')

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-center text-2xl font-bold">Alimentar Dato</h1>
        <p className="mb-6 text-center text-sm text-gray-500">Sistema de consulta de alumnos</p>
        <form
          action={async () => {
            'use server'
            await signIn('google', { redirectTo: '/admin/alumnos' })
          }}
        >
          <button
            type="submit"
            className="w-full rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Iniciar sesión con Google
          </button>
        </form>
      </div>
    </div>
  )
}

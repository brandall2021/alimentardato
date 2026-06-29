import { auth, signOut } from '@/lib/auth'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-gray-500">No autorizado.</p>
          <Link href="/admin/login" className="text-brand hover:underline">
            Iniciar sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900">
      <nav className="border-b border-gray-200 bg-white">
        <div className="h-1 bg-brand" />
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-8">
            <Link href="/admin" className="text-lg font-bold tracking-tight">
              Alimentar Dato
            </Link>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/admin/alumnos"
                className="text-sm font-semibold text-gray-600 hover:text-brand"
              >
                Alumnos
              </Link>
              <Link
                href="/admin/consultas"
                className="text-sm font-semibold text-gray-600 hover:text-brand"
              >
                Historial
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="max-w-[220px] truncate text-sm text-gray-500">{session.user?.email}</span>
            <form
              action={async () => {
                'use server'
                await signOut({ redirectTo: '/admin/login' })
              }}
            >
              <button
                type="submit"
                className="text-sm font-semibold text-gray-600 hover:text-brand"
              >
                Salir
              </button>
            </form>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  )
}

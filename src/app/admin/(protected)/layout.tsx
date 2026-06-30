import { auth, signOut } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session) {
    redirect('/admin/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900">
      <div className="bg-brand">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-1.5 sm:px-6">
          <div className="flex items-center gap-4">
            <Image
              src="/logo-face-white.png"
              alt="FACET"
              width={180}
              height={30}
              className="h-7 w-auto brightness-0 invert"
            />
            <span className="hidden text-sm font-semibold text-white/80 sm:inline">
              Facultad de Ciencias Económicas
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/60">{session.user?.email}</span>
            <form
              action={async () => {
                'use server'
                await signOut({ redirectTo: '/admin/login' })
              }}
            >
              <button
                type="submit"
                className="rounded bg-white/10 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/20"
              >
                Salir
              </button>
            </form>
          </div>
        </div>
      </div>

      <nav className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-8">
            <Link href="/admin" className="text-lg font-heading font-bold tracking-tight text-gray-800">
              Alimentar Dato
            </Link>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/admin/alumnos"
                className="text-sm font-semibold text-gray-500 transition hover:text-brand"
              >
                Alumnos
              </Link>
              <Link
                href="/admin/consultas"
                className="text-sm font-semibold text-gray-500 transition hover:text-brand"
              >
                Historial
              </Link>
              <Link
                href="/admin/configuracion"
                className="text-sm font-semibold text-gray-500 transition hover:text-brand"
              >
                Configuración
              </Link>
            </div>
          </div>
          <span className="hidden text-xs text-gray-400 lg:inline">
            Universidad Nacional de Tucumán
          </span>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>

      <footer className="mt-auto border-t border-gray-200 bg-white py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} FACET · UNT
          </p>
        </div>
      </footer>
    </div>
  )
}

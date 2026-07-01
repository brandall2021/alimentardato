import { auth, signOut } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

const NAV_ITEMS = [
  { href: '/admin/alumnos', label: 'Alumnos' },
  { href: '/admin/consultas', label: 'Historial' },
  { href: '/admin/configuracion', label: 'Configuración' },
]

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session) {
    redirect('/admin/login')
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="bg-brand shadow-lg shadow-brand/20">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 sm:px-6">
          <div className="flex items-center gap-4">
            <Image
              src="/logo-face-white.png"
              alt="FACET"
              width={180}
              height={30}
              className="h-8 w-auto brightness-0 invert"
            />
            <span className="hidden text-sm font-semibold text-white/80 sm:inline">
              Facultad de Ciencias Económicas
            </span>
          </div>
          <div className="flex items-center gap-3">
            {session.user?.image && (
              <Image
                src={session.user.image}
                alt=""
                width={28}
                height={28}
                className="rounded-full ring-2 ring-white/30"
              />
            )}
            <span className="text-xs text-white/60">{session.user?.email}</span>
            <form
              action={async () => {
                'use server'
                await signOut({ redirectTo: '/admin/login' })
              }}
            >
              <button
                type="submit"
                className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 active:scale-[0.97]"
              >
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      <nav className="sticky top-0 z-10 border-b border-border bg-white/80 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="text-lg font-heading font-bold tracking-tight text-foreground">
              Alimentar Dato
            </Link>
            <div className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-1.5 text-sm font-semibold text-muted transition hover:bg-brand-light hover:text-brand"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <span className="hidden text-xs text-muted lg:inline">
            Universidad Nacional de Tucumán
          </span>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>

      <footer className="border-t border-border bg-surface py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6">
          <p className="text-xs text-muted">
            &copy; {new Date().getFullYear()} FACET · UNT
          </p>
        </div>
      </footer>
    </div>
  )
}

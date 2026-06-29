import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function AdminDashboard() {
  const [totalAlumnos, conEmail, conTelefono, planes, anosIngreso] = await Promise.all([
    prisma.alumno.count(),
    prisma.alumno.count({ where: { email: { not: null } } }),
    prisma.alumno.count({ where: { telefono: { not: null } } }),
    prisma.alumno.findMany({
      where: { plan: { not: null } },
      distinct: ['plan'],
      select: { plan: true },
    }),
    prisma.alumno.findMany({
      where: { anoIngreso: { not: null } },
      distinct: ['anoIngreso'],
      select: { anoIngreso: true },
      orderBy: { anoIngreso: 'desc' },
    }),
  ])

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">Panel administrativo</p>
        <h1 className="mt-1 text-2xl font-bold">Dashboard</h1>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total alumnos" value={totalAlumnos} />
        <StatCard label="Con email" value={conEmail} tone="info" />
        <StatCard label="Con teléfono" value={conTelefono} tone="success" />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-md border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-base font-bold">Planes registrados</h2>
          </div>
          {planes.length === 0 ? (
            <p className="px-5 py-8 text-sm text-gray-500">Sin datos.</p>
          ) : (
            <div className="flex flex-wrap gap-2 px-5 py-4">
              {planes.map((a) => (
                <Link
                  key={a.plan}
                  href={`/admin/alumnos?plan=${encodeURIComponent(a.plan!)}`}
                  className="rounded-full bg-slate-100 px-3 py-1 text-sm text-gray-700 hover:bg-brand hover:text-white"
                >
                  {a.plan}
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-md border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-base font-bold">Años de ingreso</h2>
          </div>
          {anosIngreso.length === 0 ? (
            <p className="px-5 py-8 text-sm text-gray-500">Sin datos.</p>
          ) : (
            <div className="flex flex-wrap gap-2 px-5 py-4">
              {anosIngreso.map((a) => (
                <Link
                  key={a.anoIngreso}
                  href={`/admin/alumnos?anoIngreso=${a.anoIngreso}`}
                  className="rounded-full bg-slate-100 px-3 py-1 text-sm text-gray-700 hover:bg-brand hover:text-white"
                >
                  {a.anoIngreso}
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  tone = 'neutral',
}: {
  label: string
  value: number
  tone?: 'neutral' | 'success' | 'info'
}) {
  const tones = {
    neutral: 'border-gray-200 bg-white',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    info: 'border-blue-200 bg-blue-50 text-blue-800',
  }

  return (
    <div className={`rounded-md border p-5 shadow-sm ${tones[tone]}`}>
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  )
}

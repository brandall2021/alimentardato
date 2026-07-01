import { prisma } from '@/lib/prisma'
import Link from 'next/link'

async function getDashboardData() {
  const [
    totalAlumnos,
    conEmail,
    conTelefono,
    conLegajo,
    planes,
    anosIngreso,
    estados,
    totalConsultas,
    consultasHoy,
  ] = await Promise.all([
    prisma.alumno.count(),
    prisma.alumno.count({ where: { email: { not: null } } }),
    prisma.alumno.count({ where: { telefono: { not: null } } }),
    prisma.alumno.count({ where: { legajo: { not: null } } }),
    prisma.alumno.groupBy({
      by: ['plan'],
      _count: { id: true },
      where: { plan: { not: null } },
      orderBy: { _count: { id: 'desc' } },
    }),
    prisma.alumno.groupBy({
      by: ['anoIngreso'],
      _count: { id: true },
      where: { anoIngreso: { not: null } },
      orderBy: { anoIngreso: 'desc' },
    }),
    prisma.alumno.groupBy({
      by: ['estadoInscripcion'],
      _count: { id: true },
      where: { estadoInscripcion: { not: null } },
      orderBy: { _count: { id: 'desc' } },
    }),
    prisma.consulta.count(),
    prisma.consulta.count({
      where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    }),
  ])

  return { totalAlumnos, conEmail, conTelefono, conLegajo, planes, anosIngreso, estados, totalConsultas, consultasHoy }
}

export default async function AdminDashboard() {
  const data = await getDashboardData()

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Panel administrativo</p>
        <h1 className="mt-1 text-2xl font-bold">Dashboard</h1>
      </header>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total alumnos" value={data.totalAlumnos} />
        <StatCard label="Con email" value={data.conEmail} pct={data.totalAlumnos} />
        <StatCard label="Con teléfono" value={data.conTelefono} pct={data.totalAlumnos} />
        <StatCard label="Con legajo" value={data.conLegajo} pct={data.totalAlumnos} />
      </section>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-2">
        <StatCard label="Consultas totales" value={data.totalConsultas} tone="info" />
        <StatCard label="Consultas hoy" value={data.consultasHoy} tone="success" />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="card">
          <div className="card-header">
            <h2 className="text-base font-bold">Alumnos por año de ingreso</h2>
          </div>
          {data.anosIngreso.length === 0 ? (
            <p className="card-body text-sm text-muted">Sin datos.</p>
          ) : (
            <div className="card-body">
              <BarChart
                data={data.anosIngreso.map((a) => ({
                  label: String(a.anoIngreso),
                  value: a._count.id,
                }))}
                max={Math.max(...data.anosIngreso.map((a) => a._count.id))}
              />
            </div>
          )}
        </section>

        <section className="card">
          <div className="card-header">
            <h2 className="text-base font-bold">Alumnos por estado</h2>
          </div>
          {data.estados.length === 0 ? (
            <p className="card-body text-sm text-muted">Sin datos.</p>
          ) : (
            <div className="card-body">
              <BarChart
                data={data.estados.map((a) => ({
                  label: a.estadoInscripcion ?? 'Sin estado',
                  value: a._count.id,
                }))}
                max={Math.max(...data.estados.map((a) => a._count.id))}
              />
            </div>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="card">
          <div className="card-header">
            <h2 className="text-base font-bold">Planes</h2>
          </div>
          {data.planes.length === 0 ? (
            <p className="card-body text-sm text-muted">Sin datos.</p>
          ) : (
            <div className="flex flex-wrap gap-2 px-6 py-5">
              {data.planes.map((a) => (
                <Link
                  key={a.plan}
                  href={`/admin/alumnos?plan=${encodeURIComponent(a.plan!)}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-light px-3 py-1.5 text-sm font-medium text-brand transition hover:bg-brand hover:text-white"
                >
                  {a.plan}
                  <span className="ml-0.5 text-xs opacity-60">({a._count.id})</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <div className="card-header">
            <h2 className="text-base font-bold">Consultas recientes</h2>
          </div>
          <RecentConsultas />
        </section>
      </div>
    </div>
  )
}

async function RecentConsultas() {
  const consultas = await prisma.consulta.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { id: true, tipo: true, valores: true, resultados: true, createdAt: true },
  })

  if (consultas.length === 0) {
    return <p className="card-body text-sm text-muted">Todavía no hay consultas.</p>
  }

  return (
    <div className="divide-y divide-border text-sm">
      {consultas.map((c) => (
        <div key={c.id} className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                c.tipo === 'valores'
                  ? 'bg-brand-light text-brand'
                  : 'bg-purple-100 text-purple-700'
              }`}
            >
              {c.tipo === 'valores' ? 'Valores' : 'Filtros'}
            </span>
            <span className="max-w-[200px] truncate font-mono text-xs text-muted">
              {c.valores || '—'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-medium text-foreground">{c.resultados} resultados</span>
            <span className="text-xs text-muted">
              {c.createdAt.toLocaleDateString('es-AR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

function StatCard({
  label,
  value,
  pct,
  tone = 'neutral',
}: {
  label: string
  value: number
  pct?: number
  tone?: 'neutral' | 'success' | 'info'
}) {
  const tones = {
    neutral: 'border-border bg-surface',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    info: 'border-blue-200 bg-blue-50 text-blue-800',
  }

  return (
    <div className={`card ${tones[tone]}`}>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value.toLocaleString()}</p>
      {pct !== undefined && (
        <p className="mt-1 text-xs text-muted">
          {pct > 0 ? ((value / pct) * 100).toFixed(1) : 0}% del total
        </p>
      )}
    </div>
  )
}

function BarChart({
  data,
  max,
}: {
  data: { label: string; value: number }[]
  max: number
}) {
  const barMaxH = 160
  return (
    <div className="flex items-end gap-3" style={{ height: barMaxH }}>
      {data.map((d) => {
        const h = max > 0 ? (d.value / max) * barMaxH : 0
        return (
          <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
            <span className="text-xs font-semibold text-foreground">{d.value}</span>
            <div
              className="w-full rounded-t-md bg-brand/70 transition hover:bg-brand"
              style={{ height: Math.max(h, 4) }}
            />
            <span className="truncate text-[10px] text-muted">{d.label}</span>
          </div>
        )
      })}
    </div>
  )
}

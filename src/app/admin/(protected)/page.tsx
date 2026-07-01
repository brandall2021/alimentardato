import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Dashboard | Alimentar Dato',
  description: 'Panel principal con estadísticas de alumnos, consultas y distribución.',
}

async function getDashboardData() {
  const [totalAlumnos, conEmail, conTelefono, conLegajo, conPais, porPlan, porAno, porEstado, totalConsultas, consultasHoy, consultasTrend, paises] = await Promise.all([
    prisma.alumno.count(),
    prisma.alumno.count({ where: { email: { not: null } } }),
    prisma.alumno.count({ where: { telefono: { not: null } } }),
    prisma.alumno.count({ where: { legajo: { not: null } } }),
    prisma.alumno.count({ where: { paisOrigen: { not: null }, NOT: { paisOrigen: 'Argentina' } } }),
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
    prisma.$queryRaw<{ dia: string; total: bigint }[]>`
      SELECT DATE("createdAt")::text AS dia, COUNT(*)::bigint AS total
      FROM "Consulta"
      WHERE "createdAt" >= NOW() - INTERVAL '7 days'
      GROUP BY DATE("createdAt")
      ORDER BY dia ASC
    `,
    prisma.alumno.groupBy({
      by: ['paisOrigen'],
      _count: { id: true },
      where: { paisOrigen: { not: null }, NOT: { paisOrigen: 'Argentina' } },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    }),
  ])

  const trend = consultasTrend.map((r) => ({ dia: r.dia, total: Number(r.total) }))

  return {
    totalAlumnos, conEmail, conTelefono, conLegajo, conPais,
    porPlan, porAno, porEstado, totalConsultas, consultasHoy, trend, paises,
  }
}

export default async function AdminDashboard() {
  const data = await getDashboardData()

  const conEmailPct = data.totalAlumnos > 0 ? (data.conEmail / data.totalAlumnos) * 100 : 0
  const conTelPct = data.totalAlumnos > 0 ? (data.conTelefono / data.totalAlumnos) * 100 : 0
  const conLegajoPct = data.totalAlumnos > 0 ? (data.conLegajo / data.totalAlumnos) * 100 : 0
  const conPaisPct = data.totalAlumnos > 0 ? (data.conPais / data.totalAlumnos) * 100 : 0
  const planMax = Math.max(...data.porPlan.map((p) => p._count.id), 1)

  return (
    <div className="space-y-6">
      <header className="animate-fade-in">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Panel administrativo</p>
        <h1 className="mt-1 text-2xl font-bold">Dashboard</h1>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
        <MetricCard label="Total alumnos" value={data.totalAlumnos} icon={<UsersIcon />} />
        <MetricCard label="Con email" value={data.conEmail} pct={conEmailPct} icon={<MailIcon />} tone="info" />
        <MetricCard label="Con teléfono" value={data.conTelefono} pct={conTelPct} icon={<PhoneIcon />} tone="success" />
        <MetricCard label="Con legajo" value={data.conLegajo} pct={conLegajoPct} icon={<IdIcon />} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        <section className="card-hover lg:col-span-2">
          <div className="card-header">
            <h2 className="text-base font-bold">Consultas (últimos 7 días)</h2>
          </div>
          {data.trend.length === 0 ? (
            <EmptyState message="Sin consultas en los últimos 7 días" />
          ) : (
            <div className="card-body">
              <LineChart data={data.trend.map((d) => ({ label: d.dia.slice(5), value: d.total }))} />
            </div>
          )}
        </section>

        <section className="card-hover">
          <div className="card-header">
            <h2 className="text-base font-bold">Consultas hoy</h2>
          </div>
          <div className="flex flex-col items-center justify-center px-6 py-8">
            <p className="text-5xl font-heading font-bold tracking-tight text-brand">{data.consultasHoy}</p>
            <p className="mt-1 text-sm text-muted">de {data.totalConsultas} totales</p>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-brand transition-all"
                style={{ width: `${data.totalConsultas > 0 ? (data.consultasHoy / data.totalConsultas) * 100 : 0}%` }}
              />
            </div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="card-hover">
          <div className="card-header">
            <h2 className="text-base font-bold">Alumnos por año de ingreso</h2>
          </div>
          {data.porAno.length === 0 ? (
            <EmptyState message="Sin datos de años de ingreso" />
          ) : (
            <div className="card-body">
              <BarChart
                data={data.porAno.map((a) => ({ label: String(a.anoIngreso), value: a._count.id }))}
                max={Math.max(...data.porAno.map((a) => a._count.id))}
                color="bg-brand/70"
              />
            </div>
          )}
        </section>

        <section className="card-hover">
          <div className="card-header">
            <h2 className="text-base font-bold">Alumnos por estado</h2>
          </div>
          {data.porEstado.length === 0 ? (
            <EmptyState message="Sin datos de estados" />
          ) : (
            <div className="card-body">
              <BarChart
                data={data.porEstado.map((a) => ({ label: a.estadoInscripcion ?? 'Sin estado', value: a._count.id }))}
                max={Math.max(...data.porEstado.map((a) => a._count.id))}
                color="bg-blue-500/70"
              />
            </div>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="card-hover lg:col-span-2">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">Planes</h2>
              <Link href="/admin/alumnos" className="btn-ghost text-xs">Ver todos</Link>
            </div>
          </div>
          {data.porPlan.length === 0 ? (
            <EmptyState message="Sin planes registrados" />
          ) : (
            <div className="divide-y divide-border">
              {data.porPlan.slice(0, 8).map((p) => (
                <Link
                  key={p.plan}
                  href={`/admin/alumnos?plan=${encodeURIComponent(p.plan!)}`}
                  className="flex items-center justify-between px-6 py-3 transition hover:bg-gray-50/80"
                >
                  <span className="text-sm font-medium text-foreground">{p.plan}</span>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100 sm:w-32">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${(p._count.id / planMax) * 100}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-muted">{p._count.id}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="card-hover">
          <div className="card-header">
            <h2 className="text-base font-bold">Distribución</h2>
          </div>
          <div className="flex flex-col items-center px-6 py-6">
            <DonutChart
              data={[
                { label: 'Con email', value: data.conEmail, color: '#3b82f6' },
                { label: 'Sin email', value: data.totalAlumnos - data.conEmail, color: '#e5e7eb' },
              ]}
            />
            <div className="mt-4 flex gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />
                Con email
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-gray-200" />
                Sin email
              </span>
            </div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="card-hover">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">Extranjeros</h2>
              <span className="badge-blue">{data.conPais}</span>
            </div>
          </div>
          {data.paises.length === 0 ? (
            <p className="card-body text-sm text-muted">Todos los alumnos son de Argentina.</p>
          ) : (
            <div className="divide-y divide-border">
              {data.paises.map((p) => (
                <div key={p.paisOrigen} className="flex items-center justify-between px-6 py-3">
                  <span className="text-sm text-foreground">{p.paisOrigen}</span>
                  <span className="text-sm font-semibold text-muted">{p._count.id}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <RecentConsultas />
      </div>
    </div>
  )
}

async function RecentConsultas() {
  const consultas = await prisma.consulta.findMany({
    orderBy: { createdAt: 'desc' },
    take: 8,
    select: { id: true, tipo: true, valores: true, resultados: true, createdAt: true },
  })

  if (consultas.length === 0) {
    return (
      <section className="card-hover">
        <div className="card-header">
          <h2 className="text-base font-bold">Consultas recientes</h2>
        </div>
        <EmptyState message="Todavía no hay consultas" />
      </section>
    )
  }

  return (
    <section className="card-hover">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">Consultas recientes</h2>
          <Link href="/admin/consultas" className="btn-ghost text-xs">Ver historial</Link>
        </div>
      </div>
      <div className="divide-y divide-border">
        {consultas.map((c) => (
          <div key={c.id} className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className={`badge shrink-0 ${c.tipo === 'valores' ? 'badge-blue' : 'badge-purple'}`}>
                {c.tipo === 'valores' ? 'Valores' : 'Filtros'}
              </span>
              <span className="truncate font-mono text-xs text-muted">{c.valores || '—'}</span>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-sm font-semibold text-foreground">{c.resultados}</span>
              <span className="text-xs text-muted-light">
                {c.createdAt.toLocaleDateString('es-AR', {
                  day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function MetricCard({ label, value, pct, icon, tone = 'neutral' }: {
  label: string; value: number; pct?: number; icon: React.ReactNode; tone?: 'neutral' | 'success' | 'info'
}) {
  const tones = {
    neutral: 'border-border bg-surface',
    success: 'border-emerald-200 bg-emerald-50/50',
    info: 'border-blue-200 bg-blue-50/50',
  }

  return (
    <div className={`card-hover animate-slide-up ${tones[tone]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-label">{label}</p>
          <p className="stat-value">{value.toLocaleString()}</p>
          {pct !== undefined && (
            <p className="mt-1 text-xs text-muted">{pct.toFixed(1)}% del total</p>
          )}
        </div>
        <div className={`rounded-lg p-2.5 ${tone === 'info' ? 'bg-blue-100 text-blue-600' : tone === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-brand-light text-brand'}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function BarChart({ data, max, color = 'bg-brand/70' }: {
  data: { label: string; value: number }[]; max: number; color?: string
}) {
  return (
    <div className="flex items-end gap-2" style={{ height: 140 }}>
      {data.map((d) => {
        const h = max > 0 ? (d.value / max) * 140 : 0
        return (
          <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
            <span className="text-xs font-semibold text-foreground">{d.value}</span>
            <div
              className={`w-full rounded-t transition-all ${color} hover:opacity-80`}
              style={{ height: Math.max(h, 4) }}
            />
            <span className="truncate text-[10px] text-muted">{d.label}</span>
          </div>
        )
      })}
    </div>
  )
}

function LineChart({ data }: { data: { label: string; value: number }[] }) {
  const w = 600; const h = 140; const p = 20
  const max = Math.max(...data.map((d) => d.value), 1)
  const xs = data.map((_, i) => p + (i / (data.length - 1 || 1)) * (w - 2 * p))
  const ys = data.map((d) => h - p - ((d.value / max) * (h - 2 * p)))
  const d = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${w} ${h + p}`} className="w-full" style={{ maxHeight: 180 }}>
      {data.map((d, i) => (
        <circle key={i} cx={xs[i]} cy={ys[i]} r="4" className="fill-white stroke-brand stroke-2" />
      ))}
      <path d={d} fill="none" className="stroke-brand/70" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d={`${d} L${xs[xs.length - 1]},${h - p} L${xs[0]},${h - p} Z`} fill="url(#grad)" opacity="0.12" />
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--brand)" />
          <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {data.map((d, i) => (
        <text key={i} x={xs[i]} y={h + 14} textAnchor="middle" className="fill-muted text-[10px]">{d.label}</text>
      ))}
    </svg>
  )
}

function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const r = 50; const circ = 2 * Math.PI * r
  let offset = 0

  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      {data.map((d) => {
        const pct = total > 0 ? d.value / total : 0
        const len = pct * circ
        const seg = (
          <circle
            key={d.label}
            cx="60" cy="60" r={r}
            fill="none"
            stroke={d.color}
            strokeWidth="20"
            strokeDasharray={`${len} ${circ - len}`}
            strokeDashoffset={-offset}
            transform="rotate(-90 60 60)"
            className="transition-all"
          />
        )
        offset += len
        return seg
      })}
      <text x="60" y="56" textAnchor="middle" className="fill-foreground text-lg font-heading font-bold">
        {total}
      </text>
      <text x="60" y="72" textAnchor="middle" className="fill-muted text-[9px]">
        total
      </text>
    </svg>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center px-6 py-10">
      <svg className="mb-3 h-10 w-10 text-muted-light" fill="none" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 11.625l2.25-2.25M12 11.625l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
      <p className="text-sm text-muted">{message}</p>
    </div>
  )
}

function UsersIcon() { return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg> }
function MailIcon() { return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg> }
function PhoneIcon() { return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg> }
function IdIcon() { return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" /></svg> }
import { prisma } from '@/lib/prisma'
import type { ReactNode } from 'react'

export const metadata = { title: 'Tablas | Alimentar Dato' }

type SearchParams = Promise<{ tab?: string; p?: string; pp?: string; q?: string }>

const TABLAS = ['alumno', 'inscripcion', 'examen', 'materia'] as const
type Tabla = (typeof TABLAS)[number]

const LABELS: Record<Tabla, string> = {
  alumno: 'Alumnos',
  inscripcion: 'Inscripciones',
  examen: 'Exámenes',
  materia: 'Materias',
}

const PAGE_SIZES = [25, 50, 100] as const

function fmtFecha(v: Date | null | undefined): string {
  if (!v) return '—'
  return v.toLocaleDateString('es-AR')
}

function fmtNum(v: number | null | undefined): string {
  return v == null ? '—' : String(v)
}

function baseUrl(tab: Tabla, pp: number, q: string): string {
  const sp = new URLSearchParams({ tab, pp: String(pp) })
  if (q) sp.set('q', q)
  return `/admin/tablas?${sp.toString()}`
}

function Paginacion({ pagina, maxPaginas, base }: { pagina: number; maxPaginas: number; base: string }) {
  if (maxPaginas <= 1) return null
  const desde = Math.max(1, pagina - 2)
  const hasta = Math.min(maxPaginas, pagina + 2)
  const nums: (number | '…')[] = []
  if (desde > 1) nums.push(1)
  if (desde > 2) nums.push('…')
  for (let p = desde; p <= hasta; p++) nums.push(p)
  if (hasta < maxPaginas - 1) nums.push('…')
  if (hasta < maxPaginas) nums.push(maxPaginas)

  return (
    <div className="flex items-center justify-center gap-2 px-5 py-4">
      {pagina > 1 ? (
        <a
          href={`${base}&p=${pagina - 1}`}
          className="rounded border border-gray-300 px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          ‹ Anterior
        </a>
      ) : (
        <span className="rounded border border-gray-200 px-3 py-1 text-sm text-gray-300">‹ Anterior</span>
      )}
      {nums.map((n, i) =>
        n === '…' ? (
          <span key={`e${i}`} className="px-1 text-sm text-gray-400">
            {n}
          </span>
        ) : (
          <a
            key={n}
            href={`${base}&p=${n}`}
            className={`rounded px-3 py-1 text-sm font-medium ${
              n === pagina ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {n}
          </a>
        )
      )}
      {pagina < maxPaginas ? (
        <a
          href={`${base}&p=${pagina + 1}`}
          className="rounded border border-gray-300 px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Siguiente ›
        </a>
      ) : (
        <span className="rounded border border-gray-200 px-3 py-1 text-sm text-gray-300">Siguiente ›</span>
      )}
    </div>
  )
}

function DataTable<T>({ cols, rows }: { cols: { key: string; label: string; value: (r: T) => ReactNode }[]; rows: T[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-left">
            {cols.map((c) => (
              <th key={c.key} className="whitespace-nowrap px-5 py-3 font-semibold text-gray-600">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-gray-50">
              {cols.map((c) => (
                <td key={c.key} className="whitespace-nowrap px-5 py-3 text-gray-700">
                  {c.value(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default async function TablasPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const tab: Tabla = (TABLAS as readonly string[]).includes(params.tab ?? '') ? (params.tab as Tabla) : 'alumno'
  const pagina = Math.max(1, Math.floor(Number(params.p) || 1))
  const pp = (PAGE_SIZES as readonly number[]).includes(Number(params.pp)) ? Number(params.pp) : 50
  const q = (params.q ?? '').trim()

  const [totalAlumno, totalInscripcion, totalExamen, totalMateria] = await Promise.all([
    prisma.alumno.count(),
    prisma.inscripcion.count(),
    prisma.examen.count(),
    prisma.materia.count(),
  ])
  const totales: Record<Tabla, number> = { alumno: totalAlumno, inscripcion: totalInscripcion, examen: totalExamen, materia: totalMateria }

  type Counted = { totalFiltrado: number; rows: unknown[] }
  let counted: Counted

  if (tab === 'alumno') {
    const where = q
      ? { OR: [
          { apellidoNombre: { contains: q, mode: 'insensitive' as const } },
          { numeroDocumento: { contains: q, mode: 'insensitive' as const } },
          { cuit: { contains: q, mode: 'insensitive' as const } },
          { legajo: { contains: q, mode: 'insensitive' as const } },
        ] }
      : undefined
    const [totalFiltrado, rows] = await Promise.all([
      prisma.alumno.count({ where }),
      prisma.alumno.findMany({ where, orderBy: { apellidoNombre: 'asc' }, skip: (pagina - 1) * pp, take: pp }),
    ])
    counted = { totalFiltrado, rows }
  } else if (tab === 'inscripcion') {
    const where = q
      ? { OR: [
          { numeroDocumento: { contains: q, mode: 'insensitive' as const } },
          { regularidad: { contains: q, mode: 'insensitive' as const } },
          { cuit: { contains: q, mode: 'insensitive' as const } },
        ] }
      : undefined
    const [totalFiltrado, rows] = await Promise.all([
      prisma.inscripcion.count({ where }),
      prisma.inscripcion.findMany({
        where,
        include: { alumno: { select: { apellidoNombre: true } } },
        orderBy: { fecha: 'desc' },
        skip: (pagina - 1) * pp,
        take: pp,
      }),
    ])
    counted = { totalFiltrado, rows }
  } else if (tab === 'examen') {
    const where = q
      ? { OR: [
          { numeroDocumento: { contains: q, mode: 'insensitive' as const } },
          { materiaCodigo: { contains: q, mode: 'insensitive' as const } },
          { materiaNombre: { contains: q, mode: 'insensitive' as const } },
          { periodo: { contains: q, mode: 'insensitive' as const } },
        ] }
      : undefined
    const [totalFiltrado, rows] = await Promise.all([
      prisma.examen.count({ where }),
      prisma.examen.findMany({
        where,
        include: { alumno: { select: { apellidoNombre: true } } },
        orderBy: { fechaExamen: 'desc' },
        skip: (pagina - 1) * pp,
        take: pp,
      }),
    ])
    counted = { totalFiltrado, rows }
  } else {
    const where = q ? { OR: [{ codigo: { contains: q, mode: 'insensitive' as const } }, { nombre: { contains: q, mode: 'insensitive' as const } }] } : undefined
    const [totalFiltrado, rows] = await Promise.all([
      prisma.materia.count({ where }),
      prisma.materia.findMany({ where, orderBy: { codigo: 'asc' }, skip: (pagina - 1) * pp, take: pp }),
    ])
    counted = { totalFiltrado, rows }
  }

  const { totalFiltrado, rows } = counted
  const maxPaginas = Math.max(1, Math.ceil(totalFiltrado / pp))
  const paginaReal = Math.min(pagina, maxPaginas)
  const base = baseUrl(tab, pp, q)

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Datos</p>
        <h1 className="mt-1 text-2xl font-bold">Tablas de la base de datos</h1>
        <p className="mt-1 text-sm text-gray-500">Navegá y filtrá el contenido de cada tabla importada del SIU.</p>
      </header>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {(Object.keys(totales) as Tabla[]).map((t) => (
          <a
            key={t}
            href={baseUrl(t, pp, q)}
            className={`rounded-md border p-4 shadow-sm transition ${
              t === tab ? 'border-brand bg-brand text-white' : 'border-gray-200 bg-white hover:border-brand/40'
            }`}
          >
            <p className={`text-sm font-medium ${t === tab ? 'text-white/80' : 'text-gray-500'}`}>{LABELS[t]}</p>
            <p className="mt-1 text-2xl font-bold">{totales[t].toLocaleString('es-AR')}</p>
          </a>
        ))}
      </div>

      <section className="rounded-md border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-bold">
            {LABELS[tab]}
            <span className="ml-2 text-sm font-normal text-gray-500">
              {q
                ? `${totalFiltrado.toLocaleString('es-AR')} coincidencias`
                : `${totales[tab].toLocaleString('es-AR')} registros`}
            </span>
          </h2>
          <form method="get" action="/admin/tablas" className="flex items-center gap-2">
            <input type="hidden" name="tab" value={tab} />
            <input type="hidden" name="pp" value={pp} />
            <input
              name="q"
              defaultValue={q}
              placeholder="Buscar en la tabla..."
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand sm:w-64"
            />
            <button
              type="submit"
              className="rounded-md bg-brand px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Buscar
            </button>
            {q && (
              <a
                href={baseUrl(tab, pp, '')}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
              >
                Limpiar
              </a>
            )}
          </form>
        </div>

        {rows.length === 0 ? (
          <p className="px-5 py-8 text-sm text-gray-500">Sin resultados.</p>
        ) : tab === 'alumno' ? (
          <DataTable
            cols={[
              { key: 'a', label: 'Apellido y Nombre', value: (r: any) => <span className="font-medium">{r.apellidoNombre}</span> },
              { key: 't', label: 'Tipo Doc', value: (r: any) => r.tipoDocumento },
              { key: 'n', label: 'N° Doc', value: (r: any) => <span className="font-mono text-xs">{r.numeroDocumento}</span> },
              { key: 'c', label: 'CUIT', value: (r: any) => (r.cuit ? <span className="font-mono text-xs">{r.cuit}</span> : '—') },
              { key: 'l', label: 'Legajo', value: (r: any) => r.legajo || '—' },
              { key: 'p', label: 'Plan', value: (r: any) => r.plan || '—' },
              { key: 'a2', label: 'Año Ingreso', value: (r: any) => fmtNum(r.anoIngreso) },
              { key: 's', label: 'Sexo', value: (r: any) => (r.sexo == null ? '—' : r.sexo) },
              { key: 'e', label: 'Email', value: (r: any) => r.email || '—' },
              { key: 'tel', label: 'Teléfono', value: (r: any) => r.telefono || '—' },
              { key: 'est', label: 'Estado', value: (r: any) => r.estadoInscripcion || '—' },
            ]}
            rows={rows as any[]}
          />
        ) : tab === 'inscripcion' ? (
          <DataTable
            cols={[
              { key: 'a', label: 'Alumno', value: (r: any) => <span className="font-medium">{r.alumno?.apellidoNombre ?? '—'}</span> },
              { key: 't', label: 'Tipo Doc', value: (r: any) => r.tipoDocumento },
              { key: 'n', label: 'N° Doc', value: (r: any) => <span className="font-mono text-xs">{r.numeroDocumento}</span> },
              { key: 'c', label: 'CUIT', value: (r: any) => (r.cuit ? <span className="font-mono text-xs">{r.cuit}</span> : '—') },
              { key: 'pl', label: 'Plan', value: (r: any) => fmtNum(r.planCodigo) },
              { key: 'se', label: 'Sede', value: (r: any) => fmtNum(r.sedeCodigo) },
              { key: 'an', label: 'Año', value: (r: any) => fmtNum(r.anio) },
              { key: 'fe', label: 'Fecha', value: (r: any) => fmtFecha(r.fecha) },
              { key: 'tu', label: 'Turno', value: (r: any) => fmtNum(r.turno) },
              { key: 're', label: 'Regularidad', value: (r: any) => r.regularidad || '—' },
            ]}
            rows={rows as any[]}
          />
        ) : tab === 'examen' ? (
          <DataTable
            cols={[
              { key: 'a', label: 'Alumno', value: (r: any) => <span className="font-medium">{r.alumno?.apellidoNombre ?? '—'}</span> },
              { key: 't', label: 'Tipo Doc', value: (r: any) => r.tipoDocumento },
              { key: 'n', label: 'N° Doc', value: (r: any) => <span className="font-mono text-xs">{r.numeroDocumento}</span> },
              { key: 'fe', label: 'Fecha Examen', value: (r: any) => fmtFecha(r.fechaExamen) },
              { key: 'tu', label: 'Turno', value: (r: any) => fmtNum(r.turno) },
              { key: 'mc', label: 'Mat. Código', value: (r: any) => <span className="font-mono text-xs">{r.materiaCodigo}</span> },
              { key: 'mn', label: 'Materia', value: (r: any) => r.materiaNombre },
              { key: 'ch', label: 'Carga Hor', value: (r: any) => fmtNum(r.cargaHoraria) },
              { key: 'ap', label: 'Aprobadas', value: (r: any) => fmtNum(r.aprobadas) },
              { key: 'pe', label: 'Período', value: (r: any) => r.periodo || '—' },
              { key: 'ac', label: 'Acta', value: (r: any) => r.actaCodigo || '—' },
              { key: 'na', label: 'N° Acta', value: (r: any) => r.numeroActa || '—' },
            ]}
            rows={rows as any[]}
          />
        ) : (
          <DataTable
            cols={[
              { key: 'c', label: 'Código', value: (r: any) => <span className="font-mono text-xs">{r.codigo}</span> },
              { key: 'n', label: 'Nombre', value: (r: any) => <span className="font-medium">{r.nombre}</span> },
              { key: 'ch', label: 'Carga Horaria', value: (r: any) => fmtNum(r.cargaHoraria) },
              { key: 'o', label: 'Obligatoriedad', value: (r: any) => fmtNum(r.obligatoriedad) },
            ]}
            rows={rows as any[]}
          />
        )}

        <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>
              {rows.length > 0
                ? `${((paginaReal - 1) * pp + 1).toLocaleString('es-AR')}–${((paginaReal - 1) * pp + rows.length).toLocaleString('es-AR')} de ${totalFiltrado.toLocaleString('es-AR')}`
                : 'Sin resultados'}
            </span>
            <div className="flex items-center gap-1">
              <span className="mr-1">Filas:</span>
              {PAGE_SIZES.map((s) => (
                <a
                  key={s}
                  href={`${baseUrl(tab, s, q)}&p=${paginaReal}`}
                  className={`rounded px-2 py-0.5 text-xs font-medium ${
                    s === pp ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s}
                </a>
              ))}
            </div>
          </div>
          <Paginacion pagina={paginaReal} maxPaginas={maxPaginas} base={base} />
        </div>
      </section>
    </div>
  )
}
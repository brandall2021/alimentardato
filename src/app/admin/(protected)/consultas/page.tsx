import { listarConsultas } from '@/actions/consultas'

export const metadata = { title: 'Historial de Consultas | Alimentar Dato' }

export default async function ConsultasPage({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string }>
}) {
  const params = await searchParams
  const pagina = Number(params.pagina) || 1
  const { consultas, total, paginas } = await listarConsultas(pagina)

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Historial</p>
        <h1 className="mt-1 text-2xl font-bold">Consultas realizadas</h1>
        <p className="mt-1 text-sm text-muted">{total} consulta{total !== 1 ? 's' : ''} registrada{total !== 1 ? 's' : ''}</p>
      </header>

      {consultas.length === 0 ? (
        <div className="card">
          <div className="flex flex-col items-center px-6 py-12">
            <svg className="mb-3 h-12 w-12 text-muted-light" fill="none" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-muted">Todavía no hay consultas registradas.</p>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50/50 text-left">
                  <th className="px-6 py-3 font-semibold text-muted">Fecha</th>
                  <th className="px-6 py-3 font-semibold text-muted">Usuario</th>
                  <th className="px-6 py-3 font-semibold text-muted">Tipo</th>
                  <th className="px-6 py-3 font-semibold text-muted">Valores buscados</th>
                  <th className="px-6 py-3 font-semibold text-muted">Resultados</th>
                  <th className="px-6 py-3 font-semibold text-muted">Filtros</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {consultas.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-gray-50/50">
                    <td className="whitespace-nowrap px-6 py-3 text-muted">
                      {c.createdAt.toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-3">{c.usuario}</td>
                    <td className="px-6 py-3">
                      <span className={c.tipo === 'valores' ? 'badge-blue' : 'badge-purple'}>
                        {c.tipo === 'valores' ? 'Por valores' : 'Por filtros'}
                      </span>
                    </td>
                    <td className="max-w-xs truncate px-6 py-3 font-mono text-xs text-muted">
                      {c.valores || '—'}
                    </td>
                    <td className="px-6 py-3">
                      <span className="font-semibold text-foreground">{c.resultados}</span>
                    </td>
                    <td className="max-w-xs truncate px-6 py-3 text-xs text-muted">
                      {c.filtros || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {paginas > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: paginas }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`/admin/consultas?pagina=${p}`}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                p === pagina ? 'bg-brand text-white shadow-sm' : 'bg-gray-100 text-muted hover:bg-gray-200'
              }`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

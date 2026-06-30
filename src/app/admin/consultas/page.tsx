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
        <p className="mt-1 text-sm text-gray-500">{total} consulta{total !== 1 ? 's' : ''} registrada{total !== 1 ? 's' : ''}</p>
      </header>

      {consultas.length === 0 ? (
        <p className="text-sm text-gray-500">Todavía no hay consultas registradas.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left">
                <th className="px-5 py-3 font-semibold text-gray-600">Fecha</th>
                <th className="px-5 py-3 font-semibold text-gray-600">Usuario</th>
                <th className="px-5 py-3 font-semibold text-gray-600">Tipo</th>
                <th className="px-5 py-3 font-semibold text-gray-600">Valores buscados</th>
                <th className="px-5 py-3 font-semibold text-gray-600">Resultados</th>
                <th className="px-5 py-3 font-semibold text-gray-600">Filtros</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {consultas.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-5 py-3 text-gray-500">
                    {c.createdAt.toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-5 py-3">{c.usuario}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        c.tipo === 'valores'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {c.tipo === 'valores' ? 'Por valores' : 'Por filtros'}
                    </span>
                  </td>
                  <td className="max-w-xs truncate px-5 py-3 font-mono text-xs text-gray-600">
                    {c.valores || '—'}
                  </td>
                  <td className="px-5 py-3">
                    <span className="font-medium">{c.resultados}</span>
                  </td>
                  <td className="max-w-xs truncate px-5 py-3 text-xs text-gray-500">
                    {c.filtros || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {paginas > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: paginas }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`/admin/consultas?pagina=${p}`}
              className={`rounded px-3 py-1 text-sm font-medium ${
                p === pagina ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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

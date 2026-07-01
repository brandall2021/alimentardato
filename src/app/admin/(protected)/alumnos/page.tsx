'use client'

import { useState, useCallback } from 'react'
import {
  buscarPorValores,
  buscarPorFiltros,
  exportarResultados,
  actualizarContacto,
  type ResultadoBusqueda,
  type FiltrosAvanzados,
} from '@/actions/alumnos'

export default function AlumnosPage() {
  const [valores, setValores] = useState('')
  const [resultados, setResultados] = useState<ResultadoBusqueda[] | null>(null)
  const [buscando, setBuscando] = useState(false)
  const [filtros, setFiltros] = useState<FiltrosAvanzados>({})
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [editCampo, setEditCampo] = useState<'email' | 'telefono' | null>(null)
  const [editValor, setEditValor] = useState('')

  const handleBuscar = useCallback(async () => {
    if (!valores.trim() && !filtros.plan && !filtros.anoIngreso && !filtros.estadoInscripcion) return
    setBuscando(true)
    try {
      if (valores.trim()) {
        const res = await buscarPorValores(valores)
        setResultados(res)
      } else {
        const res = await buscarPorFiltros(filtros)
        setResultados(res)
      }
    } finally {
      setBuscando(false)
    }
  }, [valores, filtros])

  const handleExport = useCallback(async () => {
    if (!resultados || resultados.length === 0) return
    const b64 = await exportarResultados(resultados)
    const link = document.createElement('a')
    link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${b64}`
    link.download = 'alumnos_resultados.xlsx'
    link.click()
  }, [resultados])

  const handleGuardarContacto = useCallback(async (id: string, campo: 'email' | 'telefono', valor: string) => {
    if (!resultados) return
    const email = campo === 'email' ? valor || null : undefined
    const telefono = campo === 'telefono' ? valor || null : undefined
    await actualizarContacto(id, email, telefono)
    setResultados((prev) =>
      prev?.map((r) =>
        r.id === id ? { ...r, [campo]: valor || null } : r
      ) ?? null
    )
    setEditandoId(null)
    setEditCampo(null)
    setEditValor('')
  }, [resultados])

  const abrirEditor = useCallback((id: string, campo: 'email' | 'telefono', valorActual: string | null) => {
    setEditandoId(id)
    setEditCampo(campo)
    setEditValor(valorActual ?? '')
  }, [])

  const cerrarEditor = useCallback(() => {
    setEditandoId(null)
    setEditCampo(null)
    setEditValor('')
  }, [])

  function renderContacto(r: ResultadoBusqueda, campo: 'email' | 'telefono') {
    const valor = r[campo]
    const editando = editandoId === r.id && editCampo === campo

    if (editando) {
      return (
        <div className="flex items-center gap-1">
          <input
            type={campo === 'email' ? 'email' : 'tel'}
            value={editValor}
            onChange={(e) => setEditValor(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleGuardarContacto(r.id, campo, editValor)
              if (e.key === 'Escape') cerrarEditor()
            }}
            className="w-full min-w-0 rounded border border-brand px-2 py-1 text-xs focus:outline-none"
            autoFocus
          />
          <button
            onClick={() => handleGuardarContacto(r.id, campo, editValor)}
            className="shrink-0 rounded bg-brand px-2 py-1 text-xs text-white hover:bg-blue-700"
          >
            OK
          </button>
          <button
            onClick={cerrarEditor}
            className="shrink-0 rounded bg-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-300"
          >
            ✕
          </button>
        </div>
      )
    }

    if (r.encontrado && valor) {
      return (
        <span
          className="cursor-pointer"
          onClick={() => abrirEditor(r.id, campo, valor)}
          title="Editar"
        >
          {valor}
        </span>
      )
    }

    return (
      <button
        onClick={() => abrirEditor(r.id, campo, '')}
        className="rounded px-2 py-0.5 text-xs font-medium text-amber-600 ring-1 ring-dashed ring-amber-300 hover:bg-amber-50"
      >
        + Agregar {campo === 'email' ? 'email' : 'teléfono'}
      </button>
    )
  }

  const encontrados = resultados?.filter((r) => r.encontrado).length ?? 0
  const noEncontrados = resultados?.filter((r) => !r.encontrado).length ?? 0

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Consultas</p>
          <h1 className="mt-1 text-2xl font-bold">Búsqueda de Alumnos</h1>
        </div>
      </header>

      <section className="card">
        <div className="card-header">
          <h2 className="text-base font-bold">Búsqueda por valores</h2>
          <p className="text-sm text-muted">
            Pegá uno o varios N° de Documento, Legajos o Emails (separados por salto de línea, coma o espacio).
          </p>
        </div>
        <div className="card-body">
          <textarea
            value={valores}
            onChange={(e) => setValores(e.target.value)}
            placeholder="35000123&#10;40000123&#10;juan@example.com&#10;12345&#10;LE123456"
            rows={5}
            className="w-full rounded-lg border border-border p-3 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h2 className="text-base font-bold">Filtros adicionales</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-3">
          <div>
            <label className="stat-label mb-1 block">Plan</label>
            <input
              value={filtros.plan ?? ''}
              onChange={(e) => setFiltros((f) => ({ ...f, plan: e.target.value || undefined }))}
              placeholder="Ej: Contador Público"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
          <div>
            <label className="stat-label mb-1 block">Año Ingreso</label>
            <input
              value={filtros.anoIngreso ?? ''}
              onChange={(e) => setFiltros((f) => ({ ...f, anoIngreso: e.target.value ? Number(e.target.value) : undefined }))}
              placeholder="Ej: 2024"
              type="number"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
          <div>
            <label className="stat-label mb-1 block">Estado inscripción</label>
            <input
              value={filtros.estadoInscripcion ?? ''}
              onChange={(e) => setFiltros((f) => ({ ...f, estadoInscripcion: e.target.value || undefined }))}
              placeholder="Ej: Regular"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 border-t border-border px-6 py-4">
          <button
            onClick={handleBuscar}
            disabled={buscando}
            className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50 active:scale-[0.98]"
          >
            {buscando ? 'Buscando...' : 'Buscar'}
          </button>
          {resultados && resultados.length > 0 && (
            <button
              onClick={handleExport}
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted transition hover:bg-gray-50 active:scale-[0.98]"
            >
              Exportar Excel
            </button>
          )}
        </div>
      </section>

      {resultados && (
        <section className="card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-6 py-4">
            <h2 className="text-base font-bold">
              Resultados ({resultados.length})
            </h2>
            <p className="text-sm text-muted">
              {encontrados} encontrado{encontrados !== 1 ? 's' : ''}
              {noEncontrados > 0 && (
                <span className="ml-1 text-amber-600">
                  · {noEncontrados} no encontrado{noEncontrados !== 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>

          {resultados.length === 0 ? (
            <p className="card-body text-sm text-muted">Sin resultados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-gray-50/50 text-left">
                    <th className="px-6 py-3 font-semibold text-muted">Valor buscado</th>
                    <th className="px-6 py-3 font-semibold text-muted">Apellido y Nombre</th>
                    <th className="px-6 py-3 font-semibold text-muted">Email</th>
                    <th className="px-6 py-3 font-semibold text-muted">Teléfono</th>
                    <th className="px-6 py-3 font-semibold text-muted">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {resultados.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3 font-mono text-xs text-muted">{r.valor}</td>
                      <td className="px-6 py-3 font-medium">
                        {r.encontrado ? r.apellidoNombre : '—'}
                      </td>
                      <td className="px-6 py-3 text-muted">
                        {renderContacto(r, 'email')}
                      </td>
                      <td className="px-6 py-3 text-muted">
                        {renderContacto(r, 'telefono')}
                      </td>
                      <td className="px-6 py-3">
                        {r.encontrado ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            Encontrado
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                            No encontrado
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

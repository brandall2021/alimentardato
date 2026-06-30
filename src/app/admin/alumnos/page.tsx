'use client'

import { useState, useCallback, useRef } from 'react'
import {
  buscarPorValores,
  buscarPorFiltros,
  exportarResultados,
  actualizarContacto,
  type ResultadoBusqueda,
  type FiltrosAvanzados,
} from '@/actions/alumnos'
import { importarDesdeExcel } from '@/actions/importacion'

export default function AlumnosPage() {
  const [valores, setValores] = useState('')
  const [resultados, setResultados] = useState<ResultadoBusqueda[] | null>(null)
  const [buscando, setBuscando] = useState(false)
  const [filtros, setFiltros] = useState<FiltrosAvanzados>({})
  const [importando, setImportando] = useState(false)
  const [mensajeImport, setMensajeImport] = useState('')
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [editCampo, setEditCampo] = useState<'email' | 'telefono' | null>(null)
  const [editValor, setEditValor] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

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

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportando(true)
    setMensajeImport('')
    try {
      const buf = await file.arrayBuffer()
      const b64 = Buffer.from(buf).toString('base64')
      const res = await importarDesdeExcel(b64)
      setMensajeImport(`Importados: ${res.importados}, Errores: ${res.errores}`)
      if (res.errores > 0) {
        setMensajeImport((prev) => `${prev}. Revisá la consola para más detalles.`)
        console.table(res.detalles.filter((d) => !d.exito))
      }
    } catch (err) {
      setMensajeImport(`Error al importar: ${err instanceof Error ? err.message : 'desconocido'}`)
    } finally {
      setImportando(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }, [])

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
        <div className="flex flex-wrap gap-2">
          <label className="cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
            {importando ? 'Importando...' : 'Importar Excel'}
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleImport}
              disabled={importando}
            />
          </label>
        </div>
      </header>

      {mensajeImport && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {mensajeImport}
        </div>
      )}

      <section className="rounded-md border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="text-base font-bold">Búsqueda por valores</h2>
          <p className="text-sm text-gray-500">
            Pegá uno o varios N° de Documento, Legajos o Emails (separados por salto de línea, coma o espacio).
          </p>
        </div>
        <div className="space-y-3 px-5 py-4">
          <textarea
            value={valores}
            onChange={(e) => setValores(e.target.value)}
            placeholder="35000123&#10;40000123&#10;juan@example.com&#10;12345&#10;LE123456"
            rows={5}
            className="w-full rounded-md border border-gray-300 p-3 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
      </section>

      <section className="rounded-md border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="text-base font-bold">Filtros adicionales</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 px-5 py-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Plan</label>
            <input
              value={filtros.plan ?? ''}
              onChange={(e) => setFiltros((f) => ({ ...f, plan: e.target.value || undefined }))}
              placeholder="Ej: Contador Público"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Año Ingreso</label>
            <input
              value={filtros.anoIngreso ?? ''}
              onChange={(e) => setFiltros((f) => ({ ...f, anoIngreso: e.target.value ? Number(e.target.value) : undefined }))}
              placeholder="Ej: 2024"
              type="number"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Estado inscripción</label>
            <input
              value={filtros.estadoInscripcion ?? ''}
              onChange={(e) => setFiltros((f) => ({ ...f, estadoInscripcion: e.target.value || undefined }))}
              placeholder="Ej: Regular"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 border-t border-gray-200 px-5 py-4">
          <button
            onClick={handleBuscar}
            disabled={buscando}
            className="rounded-md bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {buscando ? 'Buscando...' : 'Buscar'}
          </button>
          {resultados && resultados.length > 0 && (
            <button
              onClick={handleExport}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Exportar Excel
            </button>
          )}
        </div>
      </section>

      {resultados && (
        <section className="rounded-md border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-5 py-4">
            <h2 className="text-base font-bold">
              Resultados ({resultados.length})
            </h2>
            <p className="text-sm text-gray-500">
              {encontrados} encontrado{encontrados !== 1 ? 's' : ''}
              {noEncontrados > 0 && (
                <span className="ml-1 text-amber-600">
                  · {noEncontrados} no encontrado{noEncontrados !== 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>

          {resultados.length === 0 ? (
            <p className="px-5 py-8 text-sm text-gray-500">Sin resultados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left">
                    <th className="px-5 py-3 font-semibold text-gray-600">Valor buscado</th>
                    <th className="px-5 py-3 font-semibold text-gray-600">Apellido y Nombre</th>
                    <th className="px-5 py-3 font-semibold text-gray-600">Email</th>
                    <th className="px-5 py-3 font-semibold text-gray-600">Teléfono</th>
                    <th className="px-5 py-3 font-semibold text-gray-600">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {resultados.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-mono text-xs text-gray-500">{r.valor}</td>
                      <td className="px-5 py-3 font-medium">
                        {r.encontrado ? r.apellidoNombre : '—'}
                      </td>
                      <td className="px-5 py-3 text-gray-600">
                        {renderContacto(r, 'email')}
                      </td>
                      <td className="px-5 py-3 text-gray-600">
                        {renderContacto(r, 'telefono')}
                      </td>
                      <td className="px-5 py-3">
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

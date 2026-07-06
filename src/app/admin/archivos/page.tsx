'use client'

import { useState, useRef, useCallback } from 'react'
import {
  parsearArchivo0, parsearArchivo1, parsearArchivo2, parsearArchivo3,
  importarArchivo0, importarArchivo1, importarArchivo2, importarArchivo3,
  vaciarArchivo, buscarRelacionados, obtenerResumenArchivo,
  type ArchivoKey, type ResultadoRelacionado,
  type LineaA0, type LineaA1, type LineaA2, type LineaA3,
} from '@/actions/archivos'

type TabId = ArchivoKey | 'relacionadas'

const TABS: { key: TabId; label: string }[] = [
  { key: 'archivo0', label: 'Archivo 0 — Datos personales' },
  { key: 'archivo1', label: 'Archivo 1 — Cohortes' },
  { key: 'archivo2', label: 'Archivo 2 — Aprobadas' },
  { key: 'archivo3', label: 'Archivo 3 — Regularizadas' },
  { key: 'relacionadas', label: 'Relacionadas' },
]

type ArchivoParser = {
  parse: (b64: string) => Promise<any>
  campos: number
  descripcion: string
}

const ARCHIVOS: Record<ArchivoKey, ArchivoParser> = {
  archivo0: { parse: parsearArchivo0, campos: 28, descripcion: 'Datos personales del estudiante (28 campos)' },
  archivo1: { parse: parsearArchivo1, campos: 12, descripcion: 'Cohorte y título (12 campos)' },
  archivo2: { parse: parsearArchivo2, campos: 18, descripcion: 'Materias aprobadas (18 campos)' },
  archivo3: { parse: parsearArchivo3, campos: 17, descripcion: 'Materias regularizadas (17 campos)' },
}

type ImportFn = (base64: string) => Promise<any>

const IMPORT_FNS: Record<ArchivoKey, ImportFn> = {
  archivo0: importarArchivo0,
  archivo1: importarArchivo1,
  archivo2: importarArchivo2,
  archivo3: importarArchivo3,
}

const COLUMNAS_A1 = ['Tipo Doc.', 'N° Documento', 'CUIL', 'Unidad Acad.', 'Cód. Título', 'Año Cohorte', 'Fecha Ingreso', 'Forma Ingreso', 'Fecha Egreso', 'Dependencia Ing.', 'Dependencia Eg.', 'Req. Tesis']
const COLUMNAS_A2 = ['Tipo Doc.', 'N° Documento', 'CUIL', 'Unidad Acad.', 'Cód. Título', 'Fecha Aprob.', 'Estado', 'Cód. Materia', 'Nombre Materia', 'Carga Hor.', 'Oblig.', 'Forma Aprob.', 'Dependencia', 'Año Cursada', 'Libro', 'Acta', 'Folio', 'Expediente']
const COLUMNAS_A3 = ['Tipo Doc.', 'N° Documento', 'CUIL', 'Unidad Acad.', 'Cód. Título', 'Fecha Regulariz.', 'Estado', 'Cód. Materia', 'Nombre Materia', 'Carga Hor.', 'Oblig.', 'Forma Regulariz.', 'Dependencia', 'Libro', 'Acta', 'Folio', 'Expediente']

function renderA0(l: LineaA0) {
  if (!l.valida || !l.datos) return null
  const d = l.datos
  return (
    <tr className="hover:bg-gray-50/50">
      <td className="px-3 py-1.5 text-xs">{d.apellido}</td>
      <td className="px-3 py-1.5 text-xs">{d.nombres}</td>
      <td className="px-3 py-1.5 text-xs font-mono">{d.numeroDocumento}</td>
      <td className="px-3 py-1.5 text-xs font-mono">{d.cuil}</td>
      <td className="px-3 py-1.5 text-xs">{d.fechaNacimiento.toISOString().slice(0, 10)}</td>
    </tr>
  )
}

function renderA1(l: LineaA1) {
  if (!l.valida || !l.datos) return null
  const d = l.datos
  return (
    <tr className="hover:bg-gray-50/50 text-xs">
      <td className="px-3 py-1.5">{d.tipoDocumento}</td>
      <td className="px-3 py-1.5 font-mono">{d.numeroDocumento}</td>
      <td className="px-3 py-1.5 font-mono">{d.cuil}</td>
      <td className="px-3 py-1.5">{d.unidadAcademica}</td>
      <td className="px-3 py-1.5">{d.codigoTitulo}</td>
      <td className="px-3 py-1.5">{d.anioCohorte}</td>
      <td className="px-3 py-1.5">{d.fechaIngreso.toISOString().slice(0, 10)}</td>
      <td className="px-3 py-1.5">{d.formaIngreso}</td>
      <td className="px-3 py-1.5">{d.fechaEgreso?.toISOString().slice(0, 10) ?? '—'}</td>
      <td className="px-3 py-1.5">{d.dependenciaIngreso}</td>
      <td className="px-3 py-1.5">{d.dependenciaEgreso ?? '—'}</td>
      <td className="px-3 py-1.5">{d.requiereTesis}</td>
    </tr>
  )
}

function renderA2(l: LineaA2) {
  if (!l.valida || !l.datos) return null
  const d = l.datos
  return (
    <tr className="hover:bg-gray-50/50 text-xs">
      <td className="px-3 py-1.5">{d.tipoDocumento}</td>
      <td className="px-3 py-1.5 font-mono">{d.numeroDocumento}</td>
      <td className="px-3 py-1.5 font-mono">{d.cuil}</td>
      <td className="px-3 py-1.5">{d.unidadAcademica}</td>
      <td className="px-3 py-1.5">{d.codigoTitulo}</td>
      <td className="px-3 py-1.5">{d.fechaAprobacion.toISOString().slice(0, 10)}</td>
      <td className="px-3 py-1.5">{d.estado}</td>
      <td className="px-3 py-1.5 font-mono">{d.codigoMateria}</td>
      <td className="px-3 py-1.5 max-w-[200px] truncate" title={d.nombreMateria}>{d.nombreMateria}</td>
      <td className="px-3 py-1.5">{d.cargaHoraria ?? '—'}</td>
      <td className="px-3 py-1.5">{d.obligatoriedad ?? '—'}</td>
      <td className="px-3 py-1.5">{d.formaAprobacion}</td>
      <td className="px-3 py-1.5">{d.dependencia}</td>
      <td className="px-3 py-1.5">{d.anioCursada ?? '—'}</td>
      <td className="px-3 py-1.5">{d.libro ?? '—'}</td>
      <td className="px-3 py-1.5">{d.acta ?? '—'}</td>
      <td className="px-3 py-1.5">{d.folio ?? '—'}</td>
      <td className="px-3 py-1.5 font-mono">{d.expediente ?? '—'}</td>
    </tr>
  )
}

function renderA3(l: LineaA3) {
  if (!l.valida || !l.datos) return null
  const d = l.datos
  return (
    <tr className="hover:bg-gray-50/50 text-xs">
      <td className="px-3 py-1.5">{d.tipoDocumento}</td>
      <td className="px-3 py-1.5 font-mono">{d.numeroDocumento}</td>
      <td className="px-3 py-1.5 font-mono">{d.cuil}</td>
      <td className="px-3 py-1.5">{d.unidadAcademica}</td>
      <td className="px-3 py-1.5">{d.codigoTitulo}</td>
      <td className="px-3 py-1.5">{d.fechaRegularizacion.toISOString().slice(0, 10)}</td>
      <td className="px-3 py-1.5">{d.estado}</td>
      <td className="px-3 py-1.5 font-mono">{d.codigoMateria}</td>
      <td className="px-3 py-1.5 max-w-[200px] truncate" title={d.nombreMateria}>{d.nombreMateria}</td>
      <td className="px-3 py-1.5">{d.cargaHoraria ?? '—'}</td>
      <td className="px-3 py-1.5">{d.obligatoriedad ?? '—'}</td>
      <td className="px-3 py-1.5">{d.formaRegularizacion}</td>
      <td className="px-3 py-1.5">{d.dependencia}</td>
      <td className="px-3 py-1.5">{d.libro ?? '—'}</td>
      <td className="px-3 py-1.5">{d.acta ?? '—'}</td>
      <td className="px-3 py-1.5">{d.folio ?? '—'}</td>
      <td className="px-3 py-1.5 font-mono">{d.expediente ?? '—'}</td>
    </tr>
  )
}

export default function ArchivosPage() {
  const [tab, setTab] = useState<TabId>('archivo0')
  const [fileBase64, setFileBase64] = useState('')
  const [lineas, setLineas] = useState<any[]>([])
  const [paso, setPaso] = useState<'seleccionar' | 'preview' | 'importando' | 'resultado'>('seleccionar')
  const [mensaje, setMensaje] = useState('')
  const [resumen, setResumen] = useState({ importados: 0, errores: 0, total: 0 })
  const [datosArchivo, setDatosArchivo] = useState<{ total: number; importaciones: number; ultimaImportacion: any } | null>(null)
  const [detallesError, setDetallesError] = useState<{ fila: number; error: string }[]>([])
  const [confirmarVaciar, setConfirmarVaciar] = useState(false)
  const [vaciando, setVaciando] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [docBusqueda, setDocBusqueda] = useState('')
  const [resultadosRelacion, setResultadosRelacion] = useState<ResultadoRelacionado[] | null>(null)
  const [buscandoRel, setBuscandoRel] = useState(false)

  const archivoActual = tab as ArchivoKey
  const info = ARCHIVOS[archivoActual]

  const cargarDatosArchivo = useCallback(async (a: ArchivoKey) => {
    try { setDatosArchivo(await obtenerResumenArchivo(a)) }
    catch { setDatosArchivo(null) }
  }, [])

  const handleCambiarTab = useCallback((t: TabId) => {
    setTab(t)
    setPaso('seleccionar')
    setFileBase64('')
    setLineas([])
    setMensaje('')
    setDetallesError([])
    setConfirmarVaciar(false)
    setResultadosRelacion(null)
    if (t !== 'relacionadas') cargarDatosArchivo(t)
  }, [cargarDatosArchivo])

  const handleSeleccionarArchivo = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const buf = await file.arrayBuffer()
    const b64 = Buffer.from(buf).toString('base64')
    setFileBase64(b64)

    const res = await info.parse(b64)
    setLineas(res.lineas)
    setResumen({ importados: 0, errores: res.errores, total: res.total })

    setPaso('preview')
    if (fileRef.current) fileRef.current.value = ''
  }, [info])

  const handleImportar = useCallback(async () => {
    setPaso('importando')
    setMensaje('')
    setDetallesError([])

    try {
      const fn = IMPORT_FNS[archivoActual]
      const res = await fn(fileBase64)
      setResumen({ importados: res.importados, errores: res.errores, total: res.importados + res.errores })
      const errs = res.detalles.filter((d: any) => !d.exito).map((d: any) => ({ fila: d.fila, error: d.error ?? '' }))
      setDetallesError(errs)
      setMensaje(res.errores > 0
        ? `Importación completada: ${res.importados} importados, ${res.errores} errores.`
        : `¡Importación exitosa! ${res.importados} registros importados.`)
      setPaso('resultado')
      cargarDatosArchivo(archivoActual)
    } catch (err) {
      setMensaje(`Error al importar: ${err instanceof Error ? err.message : 'desconocido'}`)
      setPaso('resultado')
    }
  }, [archivoActual, fileBase64, cargarDatosArchivo])

  const handleVaciar = useCallback(async () => {
    setVaciando(true)
    try {
      const res = await vaciarArchivo(archivoActual)
      setMensaje(`Se eliminaron ${res.eliminados} registros.`)
      setConfirmarVaciar(false)
      cargarDatosArchivo(archivoActual)
    } catch (err) {
      setMensaje(`Error al vaciar: ${err instanceof Error ? err.message : 'desconocido'}`)
    }
    setVaciando(false)
  }, [archivoActual, cargarDatosArchivo])

  const handleReiniciar = useCallback(() => {
    setFileBase64('')
    setLineas([])
    setPaso('seleccionar')
    setMensaje('')
    setDetallesError([])
    setResumen({ importados: 0, errores: 0, total: 0 })
  }, [])

  const handleBuscarRelacionadas = useCallback(async () => {
    const docs = docBusqueda.split(/[\n,;\t]+/).map((d) => d.trim()).filter(Boolean)
    if (docs.length === 0) return
    setBuscandoRel(true)
    try {
      setResultadosRelacion(await buscarRelacionados(docs))
    } finally { setBuscandoRel(false) }
  }, [docBusqueda])

  const validas = lineas.filter((l: any) => l.valida).length
  const invalidas = lineas.filter((l: any) => !l.valida).length

  function renderPreview() {
    const preview = lineas.slice(0, 20)

    if (tab === 'archivo0') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-left text-xs text-muted">
              <th className="px-3 py-2 font-semibold">Apellido</th>
              <th className="px-3 py-2 font-semibold">Nombres</th>
              <th className="px-3 py-2 font-semibold">N° Doc.</th>
              <th className="px-3 py-2 font-semibold">CUIL</th>
              <th className="px-3 py-2 font-semibold">Fecha Nac.</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {preview.map((l: LineaA0) => l.valida && l.datos ? renderA0(l) : (
                <tr key={l.fila}><td colSpan={5} className="px-3 py-1.5 text-xs text-red-500">{l.fila}: {l.error}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    if (tab === 'archivo1') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-left text-xs text-muted">
              {COLUMNAS_A1.map((c) => <th key={c} className="px-3 py-2 font-semibold whitespace-nowrap">{c}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {preview.map((l: LineaA1) => l.valida && l.datos ? renderA1(l) : (
                <tr key={l.fila}><td colSpan={12} className="px-3 py-1.5 text-xs text-red-500">{l.fila}: {l.error}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    if (tab === 'archivo2') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-left text-xs text-muted">
              {COLUMNAS_A2.map((c) => <th key={c} className="px-3 py-2 font-semibold whitespace-nowrap">{c}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {preview.map((l: LineaA2) => l.valida && l.datos ? renderA2(l) : (
                <tr key={l.fila}><td colSpan={18} className="px-3 py-1.5 text-xs text-red-500">{l.fila}: {l.error}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    if (tab === 'archivo3') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-left text-xs text-muted">
              {COLUMNAS_A3.map((c) => <th key={c} className="px-3 py-2 font-semibold whitespace-nowrap">{c}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {preview.map((l: LineaA3) => l.valida && l.datos ? renderA3(l) : (
                <tr key={l.fila}><td colSpan={17} className="px-3 py-1.5 text-xs text-red-500">{l.fila}: {l.error}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }
  }

  function renderRelacionadas() {
    return (
      <section className="card">
        <div className="card-header">
          <h2 className="text-base font-bold">Consultas relacionadas</h2>
          <p className="text-sm text-muted">Buscá N° de Documento en las 4 tablas simultáneamente.</p>
        </div>
        <div className="card-body space-y-4">
          <textarea value={docBusqueda} onChange={(e) => setDocBusqueda(e.target.value)}
            placeholder="35000123&#10;40000123"
            rows={3}
            className="w-full rounded-lg border border-border p-3 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
          <button onClick={handleBuscarRelacionadas} disabled={buscandoRel || !docBusqueda.trim()}
            className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
          >
            {buscandoRel ? 'Buscando...' : 'Buscar en todas las tablas'}
          </button>

          {resultadosRelacion && (
            <div className="space-y-4">
              {resultadosRelacion.every((r) => r.registros.length === 0) ? (
                <p className="text-sm text-muted">Sin resultados.</p>
              ) : (
                resultadosRelacion.map((r) => r.registros.length > 0 && (
                  <div key={r.archivo} className="rounded-lg border border-border">
                    <div className="bg-gray-50 px-4 py-2 border-b border-border">
                      <span className="text-sm font-semibold capitalize">{r.archivo.replace('archivo', 'Archivo ')}</span>
                      <span className="ml-2 text-xs text-muted">{r.registros.length} registro(s)</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b border-border text-left">
                          <th className="px-4 py-2 font-semibold text-muted">N° Documento</th>
                          <th className="px-4 py-2 font-semibold text-muted">CUIL</th>
                        </tr></thead>
                        <tbody className="divide-y divide-border">
                          {r.registros.map((reg) => (
                            <tr key={reg.id} className="hover:bg-gray-50/50">
                              <td className="px-4 py-2 font-mono text-xs">{reg.numeroDocumento}</td>
                              <td className="px-4 py-2 font-mono text-xs">{reg.cuil}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Archivos</p>
        <h1 className="mt-1 text-2xl font-bold">Módulo Archivos</h1>
      </header>

      <nav className="flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => handleCambiarTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px whitespace-nowrap ${
              tab === t.key ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-foreground hover:border-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'relacionadas' ? renderRelacionadas() : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="card-hover"><div className="px-5 py-4">
              <p className="stat-label">Total registros</p>
              <p className="stat-value">{datosArchivo?.total ?? '...'}</p>
            </div></div>
            <div className="card-hover"><div className="px-5 py-4">
              <p className="stat-label">Importaciones</p>
              <p className="stat-value">{datosArchivo?.importaciones ?? '...'}</p>
            </div></div>
            <div className="card-hover"><div className="px-5 py-4">
              <p className="stat-label">Última importación</p>
              <p className="text-sm font-semibold text-foreground">
                {datosArchivo?.ultimaImportacion ? new Date(datosArchivo.ultimaImportacion.fecha).toLocaleDateString('es-AR') : '—'}
              </p>
              {datosArchivo?.ultimaImportacion && (
                <p className="mt-0.5 text-xs text-muted">
                  {datosArchivo.ultimaImportacion.importados} importados · {datosArchivo.ultimaImportacion.errores} errores
                </p>
              )}
            </div></div>
          </div>

          <section className="card">
            <div className="card-header">
              <h2 className="text-base font-bold">Subir archivo</h2>
              <p className="text-sm text-muted">
                {info.descripcion}. Formato TXT pipe-delimited.
              </p>
            </div>
            <div className="space-y-4 px-5 py-4">
              <div className="flex items-center justify-between">
                {paso === 'seleccionar' && (
                  <label className="btn-primary cursor-pointer">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    Seleccionar archivo .txt
                    <input ref={fileRef} type="file" accept=".txt" className="hidden" onChange={handleSeleccionarArchivo} />
                  </label>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  {confirmarVaciar ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-600 font-medium">¿Vaciar todo?</span>
                      <button onClick={handleVaciar} disabled={vaciando} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700">
                        {vaciando ? 'Vaciando...' : 'Confirmar'}
                      </button>
                      <button onClick={() => setConfirmarVaciar(false)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted hover:bg-gray-50">
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmarVaciar(true)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">
                      Vaciar datos
                    </button>
                  )}
                </div>
              </div>

              {paso === 'preview' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">{resumen.total} líneas</span>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">{validas} válidas</span>
                    {invalidas > 0 && <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">{invalidas} con errores</span>}
                  </div>

                  {invalidas > 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      <span className="font-semibold">Líneas con errores:</span>
                      <ul className="mt-1 list-inside list-disc space-y-0.5">
                        {lineas.filter((l: any) => !l.valida).slice(0, 10).map((l: any) => (
                          <li key={l.fila}><strong>Fila {l.fila}:</strong> {l.error}</li>
                        ))}
                        {invalidas > 10 && <li className="text-amber-600">...y {invalidas - 10} más</li>}
                      </ul>
                    </div>
                  )}

                  {validas > 0 && renderPreview()}

                  {lineas.length > 20 && (
                    <p className="text-xs text-muted">Mostrando 20 de {lineas.length} líneas.</p>
                  )}

                  <div className="flex gap-2">
                    <button onClick={handleImportar} disabled={validas === 0} className="btn-primary">
                      Importar {validas} registros
                    </button>
                    <button onClick={handleReiniciar} className="btn-secondary">Cancelar</button>
                  </div>
                </div>
              )}

              {paso === 'importando' && (
                <div className="flex items-center gap-3 text-sm text-muted">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                  Importando registros...
                </div>
              )}

              {paso === 'resultado' && (
                <div className="space-y-3">
                  <div className={`rounded-lg border px-4 py-3 text-sm ${
                    resumen.errores > 0 && resumen.importados === 0
                      ? 'border-red-200 bg-red-50 text-red-800'
                      : resumen.errores > 0
                        ? 'border-amber-200 bg-amber-50 text-amber-800'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  }`}>
                    <p className="font-semibold">{mensaje}</p>
                    <p className="mt-1 text-xs opacity-75">{resumen.importados} importados | {resumen.errores} errores</p>
                  </div>

                  {detallesError.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b border-border">
                          <th className="px-4 py-2 text-left font-semibold text-muted">Fila</th>
                          <th className="px-4 py-2 text-left font-semibold text-muted">Error</th>
                        </tr></thead>
                        <tbody className="divide-y divide-border">
                          {detallesError.map((d) => (
                            <tr key={d.fila} className="hover:bg-gray-50/50">
                              <td className="px-4 py-2 font-mono text-xs">{d.fila}</td>
                              <td className="px-4 py-2 text-red-600">{d.error}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <button onClick={handleReiniciar} className="btn-primary">Importar otro archivo</button>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

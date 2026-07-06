'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  parsearArchivo0, parsearArchivo1, parsearArchivo2, parsearArchivo3,
  importarArchivo0, importarArchivo1, importarArchivo2, importarArchivo3,
  vaciarArchivo, buscarRelacionados, obtenerResumenArchivo, obtenerDashboardArchivos,
  listarCuadros, generarCuadro, borrarCuadro, regenerarTodosLosCuadros, borrarTodosLosCuadros,
  type ArchivoKey, type ResultadoRelacionado,
  type LineaA0, type LineaA1, type LineaA2, type LineaA3,
  type DashboardArchivos, type CuadroData,
} from '@/actions/archivos'

type TabId = ArchivoKey | 'dashboard' | 'relacionadas'

const TABS: { key: TabId; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'archivo0', label: 'Archivo 0' },
  { key: 'archivo1', label: 'Archivo 1' },
  { key: 'archivo2', label: 'Archivo 2' },
  { key: 'archivo3', label: 'Archivo 3' },
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
  const [tab, setTab] = useState<TabId>('dashboard')
  const [dashboard, setDashboard] = useState<DashboardArchivos | null>(null)
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

  const [cuadros, setCuadros] = useState<CuadroData[]>([])
  const [generandoCuadros, setGenerandoCuadros] = useState<Set<number>>(new Set())
  const [generandoTodos, setGenerandoTodos] = useState(false)

  const archivoActual = tab as ArchivoKey
  const info = ARCHIVOS[archivoActual]

  const cargarDatosArchivo = useCallback(async (a: ArchivoKey) => {
    try { setDatosArchivo(await obtenerResumenArchivo(a)) }
    catch { setDatosArchivo(null) }
  }, [])

  const cargarCuadros = useCallback(async () => {
    try { setCuadros(await listarCuadros()) }
    catch { setCuadros([]) }
  }, [])

  const cargarDashboard = useCallback(async () => {
    try { setDashboard(await obtenerDashboardArchivos()) }
    catch { setDashboard(null) }
  }, [])

  useEffect(() => { cargarDashboard(); cargarCuadros() }, [cargarDashboard, cargarCuadros])

  const handleCambiarTab = useCallback((t: TabId) => {
    setTab(t)
    setPaso('seleccionar')
    setFileBase64('')
    setLineas([])
    setMensaje('')
    setDetallesError([])
    setConfirmarVaciar(false)
    setResultadosRelacion(null)
    if (t === 'dashboard') cargarDashboard()
    else if (t !== 'relacionadas') cargarDatosArchivo(t)
  }, [cargarDatosArchivo, cargarDashboard])

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

  function renderDashboard() {
    if (!dashboard) {
      return <div className="flex items-center gap-3 text-sm text-muted py-8">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        Cargando dashboard...
      </div>
    }

    const etiquetas = ['Archivo 0', 'Archivo 1', 'Archivo 2', 'Archivo 3']
    const colores = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
    const totalGlobal = dashboard.totales.reduce((s, t) => s + t.registros, 0)

    const maxReg = Math.max(...dashboard.totales.map((t) => t.registros), 1)
    const maxOverlap = Math.max(...dashboard.overlap.map((o) => o.cantidad), 1)

    const archivoDocs = dashboard.totales.map((t) => t.registros)
    const totalArchivos = archivoDocs.reduce((a, b) => a + b, 0)

    return (
      <div className="space-y-6">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Dashboard</p>
          <h2 className="mt-1 text-2xl font-bold">Panorama general</h2>
          <p className="mt-1 text-sm text-muted">
            {dashboard.totalDocumentosUnicos.toLocaleString()} documentos únicos distribuidos en {totalArchivos.toLocaleString()} registros.
          </p>
        </header>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {dashboard.totales.map((t, i) => (
            <div key={t.archivo} className="card-hover" style={{ borderTop: `3px solid ${colores[i]}` }}>
              <div className="px-5 py-4">
                <p className="stat-label">{etiquetas[i]}</p>
                <p className="stat-value">{t.registros.toLocaleString()}</p>
                <p className="mt-1 text-xs text-muted">
                  {totalGlobal > 0 ? ((t.registros / totalGlobal) * 100).toFixed(1) : 0}% del total
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="card-hover">
            <div className="card-header">
              <h2 className="text-base font-bold">Registros por archivo</h2>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                {dashboard.totales.map((t, i) => (
                  <div key={t.archivo} className="flex items-center gap-3">
                    <span className="w-24 text-sm font-medium text-foreground shrink-0">{etiquetas[i]}</span>
                    <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${(t.registros / maxReg) * 100}%`, backgroundColor: colores[i] }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-muted w-20 text-right">{t.registros.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="card-hover">
            <div className="card-header">
              <h2 className="text-base font-bold">Documentos por cantidad de tablas</h2>
              <p className="text-xs text-muted">Cuántos documentos aparecen en 1, 2, 3 o 4 tablas</p>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                {dashboard.overlap.map((o) => (
                  <div key={o.tablas} className="flex items-center gap-3">
                    <span className="w-28 text-sm text-foreground shrink-0">
                      En {o.tablas} tabla{o.tablas !== 1 ? 's' : ''}
                    </span>
                    <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand/70"
                        style={{ width: `${(o.cantidad / maxOverlap) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-muted w-20 text-right">{o.cantidad.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <section className="card-hover">
          <div className="card-header">
            <h2 className="text-base font-bold">Intersección entre tablas</h2>
            <p className="text-xs text-muted">Documentos compartidos entre pares de archivos</p>
          </div>
          <div className="card-body">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted">
                    <th className="px-4 py-2 font-semibold">Tabla A</th>
                    <th className="px-4 py-2 font-semibold">Tabla B</th>
                    <th className="px-4 py-2 font-semibold text-right">Documentos compartidos</th>
                    <th className="px-4 py-2 font-semibold text-right">% respecto a A</th>
                    <th className="px-4 py-2 font-semibold text-right">% respecto a B</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {dashboard.pares.map((p) => {
                    const totalA = dashboard.totales.find((t) => etiquetas[Number(p.tablaA.slice(-1))] === p.tablaA)?.registros ?? 1
                    const totalB = dashboard.totales.find((t) => etiquetas[Number(p.tablaB.slice(-1))] === p.tablaB)?.registros ?? 1
                    const idxA = etiquetas.indexOf(p.tablaA)
                    const idxB = etiquetas.indexOf(p.tablaB)
                    return (
                      <tr key={`${p.tablaA}-${p.tablaB}`} className="hover:bg-gray-50/50">
                        <td className="px-4 py-2 font-medium flex items-center gap-2">
                          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colores[idxA] }} />
                          {p.tablaA}
                        </td>
                        <td className="px-4 py-2 font-medium flex items-center gap-2">
                          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colores[idxB] }} />
                          {p.tablaB}
                        </td>
                        <td className="px-4 py-2 text-right font-semibold">{p.cantidad.toLocaleString()}</td>
                        <td className="px-4 py-2 text-right text-muted">{((p.cantidad / totalA) * 100).toFixed(1)}%</td>
                        <td className="px-4 py-2 text-right text-muted">{((p.cantidad / totalB) * 100).toFixed(1)}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="card-hover lg:col-span-2">
            <div className="card-header">
              <h2 className="text-base font-bold">Distribución de documentos</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {dashboard.overlap.map((o) => {
                  const col = o.tablas === 4 ? '#10b981' : o.tablas === 3 ? '#3b82f6' : o.tablas === 2 ? '#f59e0b' : '#6b7280'
                  return (
                    <div key={o.tablas} className="text-center rounded-lg border border-border p-4">
                      <p className="text-2xl font-heading font-bold" style={{ color: col }}>{o.cantidad.toLocaleString()}</p>
                      <p className="mt-1 text-xs text-muted">en {o.tablas} tabla{o.tablas !== 1 ? 's' : ''}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
          <section className="card-hover">
            <div className="card-header">
              <h2 className="text-base font-bold">Totales</h2>
            </div>
            <div className="flex flex-col items-center justify-center px-6 py-6 space-y-2">
              <p className="text-4xl font-heading font-bold tracking-tight text-brand">{dashboard.totalDocumentosUnicos.toLocaleString()}</p>
              <p className="text-sm text-muted">documentos únicos</p>
              <div className="w-full h-px bg-border my-2" />
              <p className="text-xl font-heading font-semibold text-foreground">{totalArchivos.toLocaleString()}</p>
              <p className="text-sm text-muted">registros totales</p>
              <div className="w-full h-px bg-border my-2" />
              <p className="text-lg font-heading font-semibold text-emerald-600">{dashboard.docsEnTodas.toLocaleString()}</p>
              <p className="text-sm text-muted">en las 4 tablas</p>
            </div>
          </section>
        </div>

        <div className="border-t border-border pt-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Cuadros Estadísticos</h2>
              <p className="text-sm text-muted">19 cuadros generados desde los datos importados.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={async () => {
                setGenerandoTodos(true)
                try {
                  await regenerarTodosLosCuadros()
                  await cargarCuadros()
                } finally { setGenerandoTodos(false) }
              }} disabled={generandoTodos} className="btn-primary text-sm">
                {generandoTodos ? (
                  <><span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent mr-1" /> Generando...</>
                ) : 'Generar todos'}
              </button>
              <button onClick={async () => {
                if (!confirm('¿Borrar todos los cuadros?')) return
                await borrarTodosLosCuadros()
                await cargarCuadros()
              }} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">
                Borrar todos
              </button>
            </div>
          </div>

          {cuadros.length === 0 && !generandoTodos && (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <p className="text-sm text-muted">No hay cuadros generados. Hacé clic en "Generar todos".</p>
            </div>
          )}

          {generandoTodos && (
            <div className="flex items-center gap-3 text-sm text-muted py-4">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
              Generando los 19 cuadros...
            </div>
          )}

          <div className="space-y-3">
            {cuadros.map((cq) => (
              <details key={cq.numero} className="card-hover group open:ring-1 open:ring-brand/20">
                <summary className="flex items-center justify-between px-5 py-3 cursor-pointer list-none">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-foreground">{cq.nombre}</span>
                    {cq.resumen && <span className="ml-2 text-xs text-muted">— {cq.resumen}</span>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <button onClick={async (e) => {
                      e.stopPropagation()
                      setGenerandoCuadros(prev => new Set(prev).add(cq.numero))
                      try {
                        await generarCuadro(cq.numero)
                        await cargarCuadros()
                      } finally {
                        setGenerandoCuadros(prev => { const n = new Set(prev); n.delete(cq.numero); return n })
                      }
                    }} disabled={generandoCuadros.has(cq.numero)} className="text-xs text-brand hover:text-brand-dark font-semibold">
                      {generandoCuadros.has(cq.numero) ? 'Generando...' : 'Regenerar'}
                    </button>
                    <button onClick={async (e) => {
                      e.stopPropagation()
                      await borrarCuadro(cq.numero)
                      await cargarCuadros()
                    }} className="text-xs text-red-500 hover:text-red-700">Borrar</button>
                    <svg className="h-4 w-4 text-muted transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </summary>
                <div className="border-t border-border px-5 py-4">
                  {cq.filas.length === 0 ? (
                    <p className="text-sm text-muted">Sin datos.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-left text-xs text-muted">
                            {cq.columnas.map((col, i) => (
                              <th key={i} className="px-3 py-2 font-semibold whitespace-nowrap">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {cq.filas.map((fila, fi) => (
                            <tr key={fi} className="hover:bg-gray-50/50 text-xs">
                              {fila.map((celda, ci) => (
                                <td key={ci} className={`px-3 py-1.5 ${ci === 0 ? 'font-medium text-foreground' : 'text-muted'} ${typeof celda === 'number' ? 'text-right font-mono' : ''}`}>
                                  {typeof celda === 'number' ? celda.toLocaleString() : celda}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    )
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

      {tab === 'dashboard' ? renderDashboard() : tab === 'relacionadas' ? renderRelacionadas() : (
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

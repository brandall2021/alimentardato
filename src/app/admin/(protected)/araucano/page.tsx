'use client'

import { useState, useRef, useCallback } from 'react'
import { parsearArchivoTxt, importarAraucano, type LineaParseada } from '@/actions/araucano'

const FIELDS_LABELS: Record<string, string> = {
  apellido: 'Apellido',
  nombres: 'Nombres',
  codigoTipoDocumento: 'Código Tipo Doc.',
  numeroDocumento: 'N° Documento',
  cuil: 'CUIT/CUIL',
  genero: 'Género',
  fechaNacimiento: 'Fecha Nacimiento',
  cueEscuelaOrigen: 'CUE Escuela',
  codigoHorasTrabajo: 'Horas Trabajo',
  nivelInstruccionPadre: 'Instrucción Padre',
  nivelInstruccionMadre: 'Instrucción Madre',
  paisNacimiento: 'País Nacimiento',
  paisDomicilioProcedencia: 'País Domicilio',
  paisExpedidorTitulo: 'País Título',
  localidadProcedencia: 'Localidad',
  identidadGenero: 'Identidad Género',
  puebloOriginario: 'Pueblo Originario',
}

export default function AraucanoPage() {
  const [fileBase64, setFileBase64] = useState('')
  const [lineas, setLineas] = useState<LineaParseada[]>([])
  const [paso, setPaso] = useState<'seleccionar' | 'preview' | 'importando' | 'resultado'>('seleccionar')
  const [mensaje, setMensaje] = useState('')
  const [resumen, setResumen] = useState({ importados: 0, errores: 0, total: 0 })
  const [detallesError, setDetallesError] = useState<{ fila: number; error: string }[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const handleSeleccionarArchivo = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const buf = await file.arrayBuffer()
    const b64 = Buffer.from(buf).toString('base64')
    setFileBase64(b64)

    const res = await parsearArchivoTxt(b64)
    setLineas(res.lineas)
    setResumen({ importados: 0, errores: res.errores, total: res.total })

    setPaso('preview')
    if (fileRef.current) fileRef.current.value = ''
  }, [])

  const handleImportar = useCallback(async () => {
    setPaso('importando')
    setMensaje('')
    setDetallesError([])

    try {
      const res = await importarAraucano(fileBase64, true)
      setResumen({ importados: res.importados, errores: res.errores, total: res.importados + res.errores })
      const errs = res.detalles.filter((d) => !d.exito).map((d) => ({ fila: d.fila, error: d.error ?? '' }))
      setDetallesError(errs)
      if (res.errores > 0) {
        setMensaje(`Importación completada: ${res.importados} importados, ${res.errores} errores.`)
      } else {
        setMensaje(`¡Importación exitosa! ${res.importados} registros importados.`)
      }
      setPaso('resultado')
    } catch (err) {
      setMensaje(`Error al importar: ${err instanceof Error ? err.message : 'desconocido'}`)
      setPaso('resultado')
    }
  }, [fileBase64])

  const handleReiniciar = useCallback(() => {
    setFileBase64('')
    setLineas([])
    setPaso('seleccionar')
    setMensaje('')
    setDetallesError([])
    setResumen({ importados: 0, errores: 0, total: 0 })
  }, [])

  const validas = lineas.filter((l) => l.valida).length
  const invalidas = lineas.filter((l) => !l.valida).length
  const previewLineas = lineas.slice(0, 20)

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Importación</p>
        <h1 className="mt-1 text-2xl font-bold">Módulo Araucano</h1>
        <p className="mt-1 text-sm text-muted">
          Importar registros desde archivo TXT con formato pipe-delimited (Sistema Araucano).
        </p>
      </header>

      <section className="card">
        <div className="card-header">
          <h2 className="text-base font-bold">Subir archivo</h2>
          <p className="text-sm text-muted">
            Seleccioná un archivo <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono">.txt</code> con 28 campos separados por <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono">|</code>.
          </p>
        </div>
        <div className="space-y-4 px-5 py-4">
          {paso === 'seleccionar' && (
            <label className="btn-primary cursor-pointer">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              Seleccionar archivo .txt
              <input
                ref={fileRef}
                type="file"
                accept=".txt"
                className="hidden"
                onChange={handleSeleccionarArchivo}
              />
            </label>
          )}

          {paso === 'preview' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="badge-blue">{resumen.total} líneas</span>
                <span className="badge-green">{validas} válidas</span>
                {invalidas > 0 && <span className="badge-red">{invalidas} con errores</span>}
              </div>

              {invalidas > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <span className="font-semibold">Líneas con errores:</span>
                  <ul className="mt-1 list-inside list-disc space-y-0.5">
                    {lineas.filter((l) => !l.valida).slice(0, 10).map((l) => (
                      <li key={l.fila}>
                        <strong>Fila {l.fila}:</strong> {l.error}
                      </li>
                    ))}
                    {invalidas > 10 && (
                      <li className="text-amber-600">...y {invalidas - 10} más</li>
                    )}
                  </ul>
                </div>
              )}

              {previewLineas.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="table-wrap">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="table-th">#</th>
                        <th className="table-th">Estado</th>
                        <th className="table-th">Apellido</th>
                        <th className="table-th">Nombres</th>
                        <th className="table-th">N° Doc.</th>
                        <th className="table-th">CUIL</th>
                        <th className="table-th">Fecha Nac.</th>
                        {Object.keys(FIELDS_LABELS).slice(5).map((k) => (
                          <th key={k} className="table-th">{FIELDS_LABELS[k]}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {previewLineas.map((l) => (
                        <tr key={l.fila} className="hover:bg-gray-50/50">
                          <td className="table-td text-muted">{l.fila}</td>
                          <td className="table-td">
                            {l.valida
                              ? <span className="badge-green">Válida</span>
                              : <span className="badge-red" title={l.error}>Error</span>
                            }
                          </td>
                          {l.valida && l.datos ? (
                            <>
                              <td className="table-td font-medium">{l.datos.apellido}</td>
                              <td className="table-td">{l.datos.nombres}</td>
                              <td className="table-td font-mono text-xs">{l.datos.numeroDocumento}</td>
                              <td className="table-td font-mono text-xs">{l.datos.cuil}</td>
                              <td className="table-td font-mono text-xs">
                                {l.datos.fechaNacimiento.toISOString().slice(0, 10)}
                              </td>
                              <td className="table-td">{l.datos.codigoTipoDocumento}</td>
                              <td className="table-td">{l.datos.genero}</td>
                              <td className="table-td font-mono text-xs">{l.datos.cueEscuelaOrigen}</td>
                              <td className="table-td">{l.datos.codigoHorasTrabajo}</td>
                              <td className="table-td">{l.datos.nivelInstruccionPadre}</td>
                              <td className="table-td">{l.datos.nivelInstruccionMadre}</td>
                              <td className="table-td">{l.datos.paisNacimiento}</td>
                              <td className="table-td">{l.datos.paisDomicilioProcedencia}</td>
                              <td className="table-td">{l.datos.paisExpedidorTitulo}</td>
                              <td className="table-td">{l.datos.localidadProcedencia ?? '—'}</td>
                              <td className="table-td">{l.datos.identidadGenero}</td>
                              <td className="table-td">{l.datos.puebloOriginario ?? '—'}</td>
                            </>
                          ) : (
                            <>
                              <td className="table-td text-muted" colSpan={16}>—</td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {lineas.length > 20 && (
                <p className="text-xs text-muted">
                  Mostrando 20 de {lineas.length} líneas.
                </p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleImportar}
                  disabled={validas === 0}
                  className="btn-primary"
                >
                  Importar {validas} registros válidos
                </button>
                <button
                  onClick={handleReiniciar}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
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
                <p className="mt-1 text-xs opacity-75">
                  {resumen.importados} importados | {resumen.errores} errores
                </p>
              </div>

              {detallesError.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="table-wrap">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="table-th">Fila</th>
                        <th className="table-th">Error</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {detallesError.map((d) => (
                        <tr key={d.fila} className="hover:bg-gray-50/50">
                          <td className="table-td font-mono text-xs">{d.fila}</td>
                          <td className="table-td text-red-600">{d.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <button onClick={handleReiniciar} className="btn-primary">
                Importar otro archivo
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

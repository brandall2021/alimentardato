'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { obtenerConfig, guardarConfig } from '@/actions/configuracion'
import { leerEncabezadosExcel, importarDesdeExcel } from '@/actions/importacion'
import { CAMPOS_ALUMNO, type MapeoColumnas, type CampoAlumno } from '@/lib/campos-alumno'

export default function ConfiguracionPage() {
  const [devEmail, setDevEmail] = useState('')
  const [hasPassword, setHasPassword] = useState(false)

  const [fileBase64, setFileBase64] = useState('')
  const [columnas, setColumnas] = useState<string[]>([])
  const [mapeo, setMapeo] = useState<MapeoColumnas>({})
  const [paso, setPaso] = useState<'seleccionar' | 'mapear' | 'importando' | 'resultado'>('seleccionar')
  const [mensajeImport, setMensajeImport] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    obtenerConfig().then((c) => {
      setDevEmail(c.dev_email ?? '')
      setHasPassword(c.dev_password_set === 'true')
    })
  }, [])

  const handleSeleccionarArchivo = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const buf = await file.arrayBuffer()
    const b64 = Buffer.from(buf).toString('base64')
    setFileBase64(b64)

    const headers = await leerEncabezadosExcel(b64)
    setColumnas(headers)

    const auto: MapeoColumnas = {}
    const usados = new Set<CampoAlumno>()
    for (const col of headers) {
      const key = col.toLowerCase().trim().replace(/\s+/g, ' ')
      const aliasMap: Record<string, CampoAlumno> = {
        'apellido y nombre': 'apellidoNombre',
        'apellido_nombre': 'apellidoNombre',
        'nombre_completo': 'apellidoNombre',
        'tipo documento': 'tipoDocumento',
        'tipo_documento': 'tipoDocumento',
        'tipo_doc': 'tipoDocumento',
        'n° documento': 'numeroDocumento',
        'nro documento': 'numeroDocumento',
        'numero_documento': 'numeroDocumento',
        'nro_documento': 'numeroDocumento',
        'documento': 'numeroDocumento',
        'fecha de nacimiento': 'fechaNacimiento',
        'fecha_nacimiento': 'fechaNacimiento',
        'fecha_nac': 'fechaNacimiento',
        'email': 'email',
        'teléfono': 'telefono',
        'telefono': 'telefono',
        'celular': 'telefono',
        'legajo': 'legajo',
        'plan': 'plan',
        'año ingreso': 'anoIngreso',
        'ano ingreso': 'anoIngreso',
        'ano_ingreso': 'anoIngreso',
        'anio_ingreso': 'anoIngreso',
        'fecha ingreso': 'fechaIngreso',
        'fecha_ingreso': 'fechaIngreso',
        'último examen': 'ultimoExamen',
        'ultimo_examen': 'ultimoExamen',
        'última reinscripción': 'ultimaReinscripcion',
        'ultima_reinscripcion': 'ultimaReinscripcion',
        'prom. con aplazos': 'promConAplazos',
        'prom_con_aplazos': 'promConAplazos',
        'prom. sin aplazos': 'promSinAplazos',
        'prom_sin_aplazos': 'promSinAplazos',
        'actividades aprobadas': 'actividadesAprobadas',
        'actividades_aprobadas': 'actividadesAprobadas',
        'total actividades': 'totalActividades',
        'total_actividades': 'totalActividades',
        'estado inscripción': 'estadoInscripcion',
        'estado_inscripcion': 'estadoInscripcion',
        'país de origen': 'paisOrigen',
        'pais_origen': 'paisOrigen',
      }
      const campo = aliasMap[key]
      if (campo && !usados.has(campo)) {
        auto[col] = campo
        usados.add(campo)
      } else {
        auto[col] = ''
      }
    }
    setMapeo(auto)

    setPaso('mapear')
    if (fileRef.current) fileRef.current.value = ''
  }, [])

  const handleCambiarMapeo = useCallback((columna: string, campo: string) => {
    setMapeo((prev) => {
      const nuevo = { ...prev }
      const anterior = prev[columna]
      if (anterior) {
        const otro = Object.entries(nuevo).find(([, v]) => v === campo)
        if (otro) nuevo[otro[0]] = ''
      }
      nuevo[columna] = campo as CampoAlumno | ''
      return nuevo
    })
  }, [])

  const handleImportar = useCallback(async () => {
    setPaso('importando')
    setMensajeImport('')
    try {
      const mapeoFiltrado: MapeoColumnas = {}
      for (const [col, campo] of Object.entries(mapeo)) {
        if (campo) mapeoFiltrado[col] = campo
      }
      const res = await importarDesdeExcel(fileBase64, mapeoFiltrado)
      setMensajeImport(`Importados: ${res.importados}, Errores: ${res.errores}`)
      if (res.errores > 0) {
        setMensajeImport((prev) => `${prev}. Revisá la consola para más detalles.`)
        console.table(res.detalles.filter((d) => !d.exito))
      }
      setPaso('resultado')
    } catch (err) {
      setMensajeImport(`Error al importar: ${err instanceof Error ? err.message : 'desconocido'}`)
      setPaso('resultado')
    }
  }, [fileBase64, mapeo])

  const handleReiniciar = useCallback(() => {
    setFileBase64('')
    setColumnas([])
    setMapeo({})
    setPaso('seleccionar')
    setMensajeImport('')
  }, [])

  const camposUsados = new Set(Object.values(mapeo).filter(Boolean))
  const requiredFaltantes = CAMPOS_ALUMNO.filter((c) => c.required && !camposUsados.has(c.value))

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Administración</p>
        <h1 className="mt-1 text-2xl font-bold">Configuración</h1>
      </header>

      <section className="card">
        <div className="card-header">
          <h2 className="text-base font-bold">Acceso por credenciales</h2>
          <p className="text-sm text-muted">
            Configurá el email y contraseña para iniciar sesión en la aplicación.
            Si están vacíos, se usarán las variables DEV_EMAIL y DEV_PASSWORD del entorno.
          </p>
        </div>
        <form
          action={async (formData: FormData) => {
            await guardarConfig('dev_email', (formData.get('email') as string) ?? '')
            const pass = (formData.get('password') as string) ?? ''
            if (pass) {
              await guardarConfig('dev_password', pass)
              await guardarConfig('dev_password_set', 'true')
            }
          }}
          className="card-body space-y-4"
        >
          <div>
            <label htmlFor="email" className="input-label">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={devEmail}
              className="input"
            />
          </div>
          <div>
            <label htmlFor="password" className="input-label">
              {hasPassword ? 'Nueva contraseña (dejar vacío para mantener)' : 'Contraseña'}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder={hasPassword ? '········' : ''}
              className="input"
            />
          </div>
          <button
            type="submit"
            className="btn-primary"
          >
            Guardar
          </button>
        </form>
      </section>

      <section className="card">
        <div className="card-header">
          <h2 className="text-base font-bold">Importar alumnos desde Excel / CSV</h2>
          <p className="text-sm text-muted">
            Seleccioná un archivo .xlsx, .xls o .csv y asigná cada columna a un campo del sistema.
          </p>
        </div>
        <div className="space-y-4 px-5 py-4">
          {paso === 'seleccionar' && (
            <label className="btn-primary cursor-pointer">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              Seleccionar archivo
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleSeleccionarArchivo}
              />
            </label>
          )}

          {paso === 'mapear' && (
            <div className="space-y-4">
              <p className="text-sm text-muted">
                Asigná cada columna del archivo a un campo del sistema. Dejá <strong>— Ignorar —</strong> para omitir la columna.
              </p>

              {requiredFaltantes.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <span className="font-semibold">Campos requeridos faltantes:</span>{' '}
                  {requiredFaltantes.map((c) => c.label).join(', ')}
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs font-semibold uppercase text-muted">
                      <th className="pb-2 pr-4">Columna del archivo</th>
                      <th className="pb-2">Campo del sistema</th>
                    </tr>
                  </thead>
                  <tbody>
                    {columnas.map((col) => (
                      <tr key={col} className="border-b border-border">
                        <td className="py-2 pr-4 font-medium text-foreground">{col}</td>
                        <td className="py-2">
                          <select
                            value={mapeo[col] ?? ''}
                            onChange={(e) => handleCambiarMapeo(col, e.target.value)}
                            className="input max-w-xs"
                          >
                            <option value="">— Ignorar —</option>
                            {CAMPOS_ALUMNO.map((c) => (
                              <option
                                key={c.value}
                                value={c.value}
                                disabled={camposUsados.has(c.value) && mapeo[col] !== c.value}
                              >
                                {c.label}{c.required ? ' *' : ''}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleImportar}
                  disabled={requiredFaltantes.length > 0}
                  className="btn-primary"
                >
                  Importar
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
              Importando...
            </div>
          )}

          {paso === 'resultado' && (
            <div className="space-y-3">
              <div className={`rounded-lg border px-4 py-3 text-sm ${
                mensajeImport.includes('Error')
                  ? 'border-red-200 bg-red-50 text-red-800'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-800'
              }`}>
                {mensajeImport}
              </div>
              <button
                onClick={handleReiniciar}
                className="btn-primary"
              >
                Importar otro archivo
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

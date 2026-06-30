'use client'

import { useState, useRef, useCallback } from 'react'
import { obtenerConfig, guardarConfig } from '@/actions/configuracion'
import { importarDesdeExcel } from '@/actions/importacion'

export default function ConfiguracionPage() {
  const [devEmail, setDevEmail] = useState('')
  const [hasPassword, setHasPassword] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [importando, setImportando] = useState(false)
  const [mensajeImport, setMensajeImport] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  if (!loaded) {
    obtenerConfig().then((c) => {
      setDevEmail(c.dev_email ?? '')
      setHasPassword(c.dev_password_set === 'true')
      setLoaded(true)
    })
  }

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

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Administración</p>
        <h1 className="mt-1 text-2xl font-bold">Configuración</h1>
      </header>

      <section className="rounded-md border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="text-base font-bold">Acceso por credenciales</h2>
          <p className="text-sm text-gray-500">
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
          className="space-y-4 px-5 py-4"
        >
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={devEmail}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
              {hasPassword ? 'Nueva contraseña (dejar vacío para mantener)' : 'Contraseña'}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder={hasPassword ? '········' : ''}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            Guardar
          </button>
        </form>
      </section>

      <section className="rounded-md border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="text-base font-bold">Importar alumnos desde Excel</h2>
          <p className="text-sm text-gray-500">
            Seleccioná un archivo .xlsx, .xls o .csv con los datos de alumnos.
            Las columnas se mapean automáticamente por nombre.
          </p>
        </div>
        <div className="space-y-3 px-5 py-4">
          {mensajeImport && (
            <div className={`rounded-md border px-4 py-3 text-sm ${
              mensajeImport.includes('Error')
                ? 'border-red-200 bg-red-50 text-red-800'
                : 'border-emerald-200 bg-emerald-50 text-emerald-800'
            }`}>
              {mensajeImport}
            </div>
          )}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50">
            {importando ? 'Importando...' : 'Seleccionar archivo'}
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
      </section>
    </div>
  )
}

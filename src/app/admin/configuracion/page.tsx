import { obtenerConfig, guardarConfig } from '@/actions/configuracion'

export const metadata = { title: 'Configuración | Alimentar Dato' }

export default async function ConfiguracionPage() {
  const config = await obtenerConfig()
  const devEmail = config.dev_email ?? ''
  const hasPassword = config.dev_password_set === 'true'

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">Administración</p>
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
            'use server'
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
            className="rounded-md bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Guardar
          </button>
        </form>
      </section>
    </div>
  )
}

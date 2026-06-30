import { obtenerConfig, guardarConfig } from '@/actions/configuracion'

export const metadata = { title: 'Configuración | Alimentar Dato' }

export default async function ConfiguracionPage() {
  const config = await obtenerConfig()
  const devEmail = config.dev_email ?? ''
  const devPassword = config.dev_password ?? ''

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
            Configurá un email y contraseña para iniciar sesión sin Google OAuth (útil para desarrollo).
            Si están vacíos, se usará Google OAuth.
          </p>
        </div>
        <form
          action={async (formData: FormData) => {
            'use server'
            await guardarConfig('dev_email', (formData.get('email') as string) ?? '')
            await guardarConfig('dev_password', (formData.get('password') as string) ?? '')
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
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="text"
              defaultValue={devPassword}
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

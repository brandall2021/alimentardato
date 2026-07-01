'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-white via-red-50 to-white px-4">
        <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 text-center shadow-lg">
          <h1 className="mb-2 text-xl font-heading font-bold text-gray-800">Revisá tu email</h1>
          <p className="mb-6 text-sm text-gray-400">
            Si existe una cuenta con ese email, recibirás un enlace para restablecer tu contraseña.
          </p>
          <Link href="/admin/login" className="text-sm font-semibold text-brand hover:underline">
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-white via-red-50 to-white px-4">
      <div className="mb-8 text-center">
        <Image src="/logo-face.png" alt="FACET" width={220} height={42} className="mx-auto h-10 w-auto" priority />
        <p className="mt-2 text-xs text-gray-400">Facultad de Ciencias Económicas · Universidad Nacional de Tucumán</p>
      </div>

      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-lg">
        <h1 className="mb-1 text-center text-xl font-heading font-bold text-gray-800">Recuperar contraseña</h1>
        <p className="mb-6 text-center text-sm text-gray-400">
          Ingresá tu email y te enviaremos un enlace
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm transition focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'Enviando...' : 'Enviar enlace'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          <Link href="/admin/login" className="font-semibold text-brand hover:underline">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
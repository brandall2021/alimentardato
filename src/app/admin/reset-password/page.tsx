'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ResetForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirm) {
      setError('Las contraseñas no coinciden')
      setLoading(false)
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      setLoading(false)
      return
    }

    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Error al restablecer la contraseña')
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 text-center shadow-lg">
        <h1 className="mb-2 text-xl font-heading font-bold text-gray-800">Contraseña actualizada</h1>
        <p className="mb-6 text-sm text-gray-400">Tu contraseña se actualizó correctamente</p>
        <Link href="/admin/login" className="text-sm font-semibold text-brand hover:underline">
          Iniciar sesión
        </Link>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 text-center shadow-lg">
        <h1 className="mb-2 text-xl font-heading font-bold text-gray-800">Token inválido</h1>
        <p className="mb-6 text-sm text-gray-400">El enlace de recuperación no es válido o expiró</p>
        <Link href="/admin/forgot-password" className="text-sm font-semibold text-brand hover:underline">
          Solicitar nuevo enlace
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-lg">
      <h1 className="mb-1 text-center text-xl font-heading font-bold text-gray-800">Nueva contraseña</h1>
      <p className="mb-6 text-center text-sm text-gray-400">Ingresá tu nueva contraseña</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">Nueva contraseña</label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm transition focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
        <div>
          <label htmlFor="confirm" className="mb-1 block text-sm font-medium text-gray-700">Confirmar contraseña</label>
          <input
            id="confirm"
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm transition focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Actualizando...' : 'Actualizar contraseña'}
        </button>
      </form>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-white via-red-50 to-white px-4">
      <Suspense fallback={<div>Cargando...</div>}>
        <ResetForm />
      </Suspense>
    </div>
  )
}
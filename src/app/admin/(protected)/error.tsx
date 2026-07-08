'use client'

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <p className="text-sm font-semibold uppercase tracking-wide text-red-600">Error</p>
      <h1 className="mt-2 text-2xl font-bold">Algo salió mal</h1>
      <p className="mt-2 text-sm text-muted">{error.message}</p>
      <button onClick={reset} className="btn-primary mt-6">
        Reintentar
      </button>
    </div>
  )
}

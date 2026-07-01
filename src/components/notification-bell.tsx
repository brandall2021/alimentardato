'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface Notificacion {
  id: string
  type: string
  title: string
  message: string | null
  link: string | null
  read: boolean
  createdAt: string
}

export default function NotificationBell() {
  const { data: session } = useSession()
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [noLeidas, setNoLeidas] = useState(0)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!session?.user) return
    fetch('/api/notificaciones')
      .then((r) => r.json())
      .then((d) => {
        setNotificaciones(d.notificaciones || [])
        setNoLeidas(d.noLeidas || 0)
      })
    const interval = setInterval(() => {
      fetch('/api/notificaciones')
        .then((r) => r.json())
        .then((d) => {
          setNotificaciones(d.notificaciones || [])
          setNoLeidas(d.noLeidas || 0)
        })
    }, 30000)
    return () => clearInterval(interval)
  }, [session])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const marcarLeida = async (id: string) => {
    await fetch('/api/notificaciones', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
    setNoLeidas((prev) => Math.max(0, prev - 1))
  }

  if (!session?.user) return null

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-white/80 hover:text-white transition-colors"
        aria-label="Notificaciones"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {noLeidas > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 max-h-96 w-80 overflow-y-auto rounded-lg border bg-white shadow-xl">
          <div className="flex items-center justify-between border-b p-3">
            <span className="text-sm font-semibold">Notificaciones</span>
            {noLeidas > 0 && (
              <button
                onClick={() => marcarLeida('todas')}
                className="text-xs text-orange-600 hover:underline"
              >
                Marcar todas leídas
              </button>
            )}
          </div>
          {notificaciones.length === 0 ? (
            <p className="p-4 text-center text-sm text-gray-500">Sin notificaciones</p>
          ) : (
            notificaciones.map((n) => (
              <div
                key={n.id}
                className={`cursor-pointer border-b p-3 last:border-0 hover:bg-gray-50 ${
                  !n.read ? 'bg-orange-50' : ''
                }`}
                onClick={() => {
                  marcarLeida(n.id)
                  setOpen(false)
                }}
              >
                {n.link ? (
                  <Link href={n.link} className="block">
                    <p className="text-sm font-medium">{n.title}</p>
                    {n.message && <p className="mt-0.5 truncate text-xs text-gray-500">{n.message}</p>}
                    <p className="mt-1 text-[10px] text-gray-400">
                      {new Date(n.createdAt).toLocaleDateString('es-AR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </Link>
                ) : (
                  <>
                    <p className="text-sm font-medium">{n.title}</p>
                    {n.message && <p className="mt-0.5 truncate text-xs text-gray-500">{n.message}</p>}
                  </>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
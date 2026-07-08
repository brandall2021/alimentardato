'use client'

import { useState, useRef, useEffect } from 'react'

type Message = {
  role: 'user' | 'assistant'
  content: string
  sql?: string
  data?: Record<string, unknown>[]
  columns?: string[]
  rowCount?: number
  error?: string
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '¡Hola! Soy el asistente de base de datos. Hacé cualquier consulta sobre los datos de alumnos, archivos, araucano y más.',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')

    const userMsg: Message = { role: 'user', content: text }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setLoading(true)

    try {
      const apiMessages = updated.map((m) => ({ role: m.role, content: m.content }))
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      })
      const data: Message = await res.json()
      setMessages((prev) => [...prev, data])
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Error de conexión. Intentalo de nuevo.' }])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-[calc(100vh-13rem)] flex-col space-y-4">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Chatbot</p>
        <h1 className="mt-1 text-2xl font-bold">Consultá los datos con lenguaje natural</h1>
      </header>

      <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-border bg-surface shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] space-y-2 ${msg.role === 'user' ? 'order-1' : 'order-1'}`}>
                {msg.role === 'user' ? (
                  <div className="rounded-2xl rounded-br-md bg-brand px-4 py-2.5 text-sm text-white shadow-sm">
                    {msg.content}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="rounded-2xl rounded-bl-md border border-border bg-gray-50 px-4 py-2.5 text-sm leading-relaxed text-foreground">
                      <span className="prose prose-sm max-w-none whitespace-pre-wrap">{msg.content}</span>
                    </div>

                    {msg.sql && (
                      <div className="rounded-lg border border-blue-200 bg-blue-50">
                        <div className="flex items-center gap-2 border-b border-blue-200 px-3 py-1.5">
                          <svg className="h-3.5 w-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>
                          <span className="text-xs font-semibold text-blue-700">SQL</span>
                          <button
                            onClick={() => navigator.clipboard.writeText(msg.sql!)}
                            className="ml-auto text-xs text-blue-500 hover:text-blue-700"
                          >
                            Copiar
                          </button>
                        </div>
                        <pre className="overflow-x-auto px-3 py-2 text-xs text-blue-900"><code>{msg.sql}</code></pre>
                      </div>
                    )}

                    {msg.error && (
                      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                        {msg.error}
                      </div>
                    )}

                    {msg.data && msg.columns && msg.data.length > 0 && (
                      <div className="overflow-x-auto rounded-lg border border-border">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border bg-gray-100">
                              {msg.columns.map((col, ci) => (
                                <th key={ci} className="whitespace-nowrap px-3 py-2 text-left font-semibold text-muted">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {msg.data.map((row, ri) => (
                              <tr key={ri} className="hover:bg-gray-50">
                                {msg.columns!.map((col, ci) => (
                                  <td key={ci} className="whitespace-nowrap px-3 py-1.5 text-muted">
                                    {String(row[col] ?? '')}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {msg.rowCount !== undefined && (
                      <p className="text-xs text-muted-light">{msg.rowCount} fila{msg.rowCount !== 1 ? 's' : ''}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-border bg-gray-50 px-4 py-3">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-brand" style={{ animationDelay: '0ms' }} />
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-brand" style={{ animationDelay: '150ms' }} />
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-brand" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="border-t border-border p-3">
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Ej: ¿Cuántos alumnos hay por plan?"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="btn-primary"
            >
              {loading ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

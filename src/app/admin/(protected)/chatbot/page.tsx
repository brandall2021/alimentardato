'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { listChatSessions, getChatSession, createChatSession, deleteChatSession, updateChatSessionTitle, getTablesList } from '@/actions/chat'

type TableColumn = { name: string; type: string; nullable: boolean; isPk: boolean }
type TableInfo = { name: string; columns: TableColumn[]; rowCount: number }

type Message = {
  id?: string
  role: 'user' | 'assistant'
  content: string
  sql?: string
  data?: Record<string, unknown>[]
  columns?: string[]
  rowCount?: number
  error?: string
  createdAt?: string
}

type ChatSessionSummary = {
  id: string
  title: string
  updatedAt: Date
  _count: { messages: number }
}

export default function ChatbotPage() {
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [tables, setTables] = useState<TableInfo[]>([])
  const [expandedTable, setExpandedTable] = useState<string | null>(null)
  const [sidebarTab, setSidebarTab] = useState<'sessions' | 'tables'>('sessions')
  const bottomRef = useRef<HTMLDivElement>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [editingTitle, setEditingTitle] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    async function init() {
      try {
        const [sessionList, tableList] = await Promise.all([
          listChatSessions(),
          getTablesList(),
        ])
        setSessions(sessionList)
        setTables(tableList)
        if (sessionList.length > 0) {
          await loadSession(sessionList[0].id)
        }
      } catch {
        // ignore
      } finally {
        setInitialLoading(false)
      }
    }
    init()
  }, [])

  async function loadSession(id: string) {
    setLoading(true)
    try {
      const chat = await getChatSession(id)
      if (!chat) return
      setCurrentSessionId(chat.id)
      setMessages(
        chat.messages.map((m) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          sql: m.sql ?? undefined,
          data: (m.data as Record<string, unknown>[]) ?? undefined,
          columns: m.columns ? JSON.parse(m.columns) : undefined,
          rowCount: m.rowCount ?? undefined,
          error: m.error ?? undefined,
          createdAt: m.createdAt.toISOString(),
        }))
      )
    } catch {
      //
    } finally {
      setLoading(false)
    }
  }

  async function handleNewSession() {
    try {
      const chat = await createChatSession()
      setSessions((prev) => [{ ...chat, _count: { messages: 0 }, updatedAt: chat.updatedAt ?? chat.createdAt }, ...prev])
      setCurrentSessionId(chat.id)
      setMessages([])
      setSidebarTab('sessions')
    } catch {
      //
    }
  }

  async function handleDeleteSession(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    try {
      await deleteChatSession(id)
      setSessions((prev) => prev.filter((s) => s.id !== id))
      if (currentSessionId === id) {
        const remaining = sessions.filter((s) => s.id !== id)
        if (remaining.length > 0) {
          await loadSession(remaining[0].id)
        } else {
          setCurrentSessionId(null)
          setMessages([])
        }
      }
    } catch {
      //
    }
  }

  async function handleRename(id: string) {
    if (editValue.trim() && editValue !== sessions.find((s) => s.id === id)?.title) {
      await updateChatSessionTitle(id, editValue.trim())
      setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, title: editValue.trim() } : s)))
    }
    setEditingTitle(null)
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return

    let sessionId = currentSessionId
    if (!sessionId) {
      try {
        const chat = await createChatSession()
        sessionId = chat.id
        setSessions((prev) => [{ ...chat, _count: { messages: 0 }, updatedAt: chat.updatedAt ?? chat.createdAt }, ...prev])
        setCurrentSessionId(chat.id)
      } catch {
        return
      }
    }

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
        body: JSON.stringify({ messages: apiMessages, sessionId }),
      })
      const data: Message & { sessionId?: string } = await res.json()
      setMessages((prev) => [...prev, data])

      const updatedSessions = await listChatSessions()
      setSessions(updatedSessions)
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

  function formatDate(d: Date) {
    const date = new Date(d)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    if (diff < 86400000) return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
  }

  if (initialLoading) {
    return (
      <div className="flex h-[calc(100vh-13rem)] items-center justify-center">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-brand" style={{ animationDelay: '0ms' }} />
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-brand" style={{ animationDelay: '150ms' }} />
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-brand" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-13rem)] gap-4">
      <div className="flex w-72 shrink-0 flex-col rounded-xl border border-border bg-surface shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        <div className="border-b border-border p-3">
          <button onClick={handleNewSession} className="btn-primary w-full justify-start">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nueva consulta
          </button>
        </div>

        <div className="flex border-b border-border">
          <button
            onClick={() => setSidebarTab('sessions')}
            className={`flex-1 px-3 py-2 text-xs font-semibold transition ${sidebarTab === 'sessions' ? 'border-b-2 border-brand text-brand' : 'text-muted hover:text-foreground'}`}
          >
            Historial
          </button>
          <button
            onClick={() => setSidebarTab('tables')}
            className={`flex-1 px-3 py-2 text-xs font-semibold transition ${sidebarTab === 'tables' ? 'border-b-2 border-brand text-brand' : 'text-muted hover:text-foreground'}`}
          >
            Tablas
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {sidebarTab === 'sessions' ? (
            sessions.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted">Sin consultas aún</div>
            ) : (
              <div className="space-y-0.5 p-2">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => loadSession(s.id)}
                    className={`group flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                      currentSessionId === s.id ? 'bg-brand-light text-brand' : 'text-muted hover:bg-gray-50 hover:text-foreground'
                    }`}
                  >
                    <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                    </svg>
                    <div className="min-w-0 flex-1">
                      {editingTitle === s.id ? (
                        <input
                          className="w-full rounded border border-brand px-1 py-0.5 text-xs outline-none"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleRename(s.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename(s.id)
                            if (e.key === 'Escape') setEditingTitle(null)
                          }}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div
                          className="truncate text-xs"
                          onDoubleClick={(e) => {
                            e.stopPropagation()
                            setEditingTitle(s.id)
                            setEditValue(s.title)
                          }}
                          title={s.title}
                        >
                          {s.title}
                        </div>
                      )}
                      <div className="text-[10px] text-muted-light">{formatDate(s.updatedAt)}</div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteSession(e, s.id)}
                      className="shrink-0 rounded p-1 text-muted-light transition hover:bg-red-100 hover:text-red-600"
                      title="Eliminar conversación"
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="space-y-1 p-2">
              {tables.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted">Cargando tablas...</div>
              ) : (
                tables.map((t) => (
                  <div key={t.name}>
                    <button
                      onClick={() => setExpandedTable(expandedTable === t.name ? null : t.name)}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                        expandedTable === t.name ? 'bg-brand-light text-brand' : 'text-muted hover:bg-gray-50 hover:text-foreground'
                      }`}
                    >
                      <svg
                        className={`h-3 w-3 transition ${expandedTable === t.name ? 'rotate-90' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                      <span className="font-mono text-xs font-semibold">{t.name}</span>
                      <span className="ml-auto text-[10px] text-muted-light">{t.rowCount} filas</span>
                    </button>
                    {expandedTable === t.name && (
                      <div className="ml-4 space-y-0.5 border-l-2 border-brand-light pl-3">
                        {t.columns.map((col) => (
                          <div key={col.name} className="flex items-center gap-2 py-0.5">
                            <span className="font-mono text-[11px] text-foreground">{col.name}</span>
                            <span className="text-[10px] text-muted-light">{col.type}</span>
                            {col.isPk && <span className="badge-blue text-[9px]">PK</span>}
                            {col.nullable && <span className="text-[9px] text-muted-light">?</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col rounded-xl border border-border bg-surface shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        {messages.length === 0 && !loading ? (
          <div className="flex flex-1 flex-col items-center justify-center space-y-4 p-8 text-center">
            <div className="rounded-full bg-brand-light p-4">
              <svg className="h-8 w-8 text-brand" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
              </svg>
            </div>
            <h2 className="text-lg font-heading font-bold text-foreground">Consultá los datos con lenguaje natural</h2>
            <p className="max-w-md text-sm text-muted">
              Preguntá sobre alumnos, planes, archivos importados y más. El asistente genera SQL y te muestra los resultados.
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                '¿Cuántos alumnos hay por plan?',
                '¿Cuántos registros tiene cada archivo?',
                '¿Cuál es el promedio de edad de los alumnos?',
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q) }}
                  className="rounded-full border border-border px-3 py-1.5 text-xs text-muted transition hover:border-brand hover:text-brand"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.map((msg, i) => (
              <div key={msg.id ?? i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
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
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-light">{msg.rowCount} fila{msg.rowCount !== 1 ? 's' : ''}</p>
                          {msg.data && msg.columns && msg.data.length > 0 && (
                            <button
                              onClick={() => {
                                const csvContent = [msg.columns!.join(','), ...msg.data!.map((row) => msg.columns!.map((col) => String(row[col] ?? '').replace(/,/g, ' ')).join(','))].join('\n')
                                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
                                const link = document.createElement('a')
                                link.href = URL.createObjectURL(blob)
                                link.download = 'resultados.csv'
                                link.click()
                              }}
                              className="text-xs text-blue-500 hover:text-blue-700"
                            >
                              Descargar CSV
                            </button>
                          )}
                        </div>
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
        )}

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

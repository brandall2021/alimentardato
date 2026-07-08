import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { Pool } from 'pg'
import { getCachedSchema } from '@/lib/db-schema'
import { obtenerOpenAIKey } from '@/actions/configuracion'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function getOpenAI() {
  const envKey = process.env.OPENAI_API_KEY
  const dbKey = envKey ? null : await obtenerOpenAIKey()
  const key = envKey ?? dbKey
  if (!key) throw new Error('OPENAI_API_KEY no está configurada. Agregala en /admin/configuracion o en el archivo .env')
  return new OpenAI({ apiKey: key })
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

const READONLY_RE = /^\s*(SELECT|WITH|EXPLAIN|DESCRIBE|SHOW)\b/i
const BLOCKED_RE = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE)\b/i

type Msg = { role: 'user' | 'assistant'; content: string }
type ApiMsg = OpenAI.Chat.Completions.ChatCompletionMessageParam | { role: 'tool'; content: string; tool_call_id: string }

async function executeSql(sql: string) {
  const cleanSql = sql.trim().replace(/;+\s*$/, '')
  if (!READONLY_RE.test(cleanSql)) {
    return { error: 'Solo se permiten consultas SELECT.' }
  }
  if (BLOCKED_RE.test(cleanSql)) {
    return { error: 'No se permiten consultas de modificación de datos.' }
  }
  if (cleanSql.length > 8000) {
    return { error: 'La consulta es demasiado larga (máx. 8000 caracteres).' }
  }

  const client = await pool.connect()
  try {
    await client.query('SET statement_timeout = 15000')
    const result = await client.query(cleanSql)
    return {
      rows: result.rows.slice(0, 500),
      fields: result.fields.map((f) => f.name),
      rowCount: result.rowCount ?? result.rows.length,
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error desconocido'
    return { error: `Error al ejecutar la consulta: ${message}` }
  } finally {
    client.release()
  }
}

const TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'execute_sql',
      description: 'Ejecuta una consulta SQL SELECT en la base de datos y devuelve los resultados.',
      strict: true,
      parameters: {
        type: 'object',
        properties: {
          sql: {
            type: 'string',
            description: 'Consulta SQL SELECT a ejecutar (SQL PostgreSQL).',
          },
        },
        required: ['sql'],
        additionalProperties: false,
      },
    },
  },
]

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { messages, sessionId: rawSessionId }: { messages: Msg[]; sessionId?: string } = await req.json()
  if (!messages?.length) {
    return NextResponse.json({ error: 'Mensaje requerido' }, { status: 400 })
  }

  const schema = await getCachedSchema()

  const systemPrompt = `Eres un asistente de base de datos del sistema Alimentar Dato de FACET-UNT.
Tu función es traducir preguntas en lenguaje natural a consultas SQL y mostrar los resultados.

Esquema de la base de datos:
${schema}

REGLAS:
1. Genera únicamente consultas SELECT (solo lectura).
2. Usa sintaxis PostgreSQL.
3. Si la pregunta es ambigua, pide aclaración ANTES de ejecutar SQL.
4. Explica qué consulta ejecutaste y qué significan los resultados.
5. Si no encontrás resultados, decilo claramente.
6. Respondé SIEMPRE en español argentino.
7. Usá la herramienta execute_sql para ejecutar las consultas.
8. Si la pregunta no es sobre los datos, respondé amablemente que solo podés ayudar con consultas a la base de datos.`

  const apiMessages: ApiMsg[] = [
    { role: 'system', content: systemPrompt },
    ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  ]

  try {
    const openai = await getOpenAI()
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: apiMessages,
      tools: TOOLS,
      tool_choice: 'auto',
      max_tokens: 4096,
    })

    const choice = response.choices[0]
    const toolCalls = choice.message.tool_calls

    let finalContent = choice.message.content ?? ''
    let sql = ''
    let data: Record<string, unknown>[] | null = null
    let columns: string[] | null = null
    let rowCount = 0
    let sqlError: string | null = null

    if (toolCalls?.length) {
      const toolMessages: ApiMsg[] = [{ role: 'assistant', content: null, tool_calls: choice.message.tool_calls }]
      for (const tc of toolCalls) {
        if (tc.type !== 'function') continue
        if (tc.function.name === 'execute_sql') {
          const args = JSON.parse(tc.function.arguments)
          sql = args.sql
          const result = await executeSql(sql)
          if ('error' in result) {
            sqlError = result.error ?? 'Error desconocido'
            toolMessages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify({ error: result.error }) })
          } else {
            data = result.rows
            columns = result.fields
            rowCount = result.rowCount
            toolMessages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify({ rows: result.rows, fields: result.fields, rowCount: result.rowCount }) })
          }
        }
      }

      const followUp = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [...apiMessages, ...toolMessages],
        max_tokens: 4096,
      })
      finalContent = followUp.choices[0].message.content ?? ''
    }

    let sessionId: string | null = rawSessionId ?? null

    if (sessionId) {
      const chat = await prisma.chatSession.findUnique({ where: { id: sessionId } })
      if (chat && chat.userId === session.user.id) {
        const firstUserMsg = messages.find((m) => m.role === 'user')
        if (chat.title === 'Nueva consulta' && firstUserMsg) {
          const newTitle = firstUserMsg.content.slice(0, 80) + (firstUserMsg.content.length > 80 ? '...' : '')
          await prisma.chatSession.update({ where: { id: sessionId }, data: { title: newTitle } })
        }

        const lastUserMsg = messages[messages.length - 1]
        if (lastUserMsg?.role === 'user') {
          await prisma.chatMessage.create({
            data: { sessionId, role: 'user', content: lastUserMsg.content },
          })
        }

        await prisma.chatMessage.create({
          data: {
            sessionId,
            role: 'assistant',
            content: finalContent,
            sql: sql || null,
            data: data ? JSON.parse(JSON.stringify(data)) : undefined,
            columns: columns ? JSON.stringify(columns) : null,
            rowCount: rowCount || null,
            error: sqlError,
          },
        })

        await prisma.chatSession.update({ where: { id: sessionId }, data: { updatedAt: new Date() } })
      }
    }

    return NextResponse.json({
      role: 'assistant',
      content: finalContent,
      sql: sql || undefined,
      data: data ?? undefined,
      columns: columns ?? undefined,
      rowCount: rowCount || undefined,
      error: sqlError,
      sessionId,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error desconocido'
    return NextResponse.json({ role: 'assistant', content: `Error al procesar la consulta: ${message}`, error: message }, { status: 500 })
  }
}

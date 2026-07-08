export function parseDateAAAAMMDD(val: string): Date | null {
  val = val.trim()
  if (!val || val.length !== 8) return null
  const m = val.match(/^(\d{4})(\d{2})(\d{2})$/)
  if (!m) return null
  const d = new Date(+m[1], +m[2] - 1, +m[3])
  return isNaN(d.getTime()) ? null : d
}

export function limpiarString(val: string): string {
  return val.trim()
}

export function parseNumero(val: string): number | null {
  const s = val.trim()
  if (!s) return null
  const n = Number(s)
  return isNaN(n) ? null : n
}

export function parseSN(val: string): string {
  const s = val.trim().toUpperCase()
  return s === 'S' ? 'S' : 'N'
}

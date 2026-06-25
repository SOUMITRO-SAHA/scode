export function todayStr(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function dateFromFilename(name: string): Date | null {
  const match = name.match(/scode-(\d{4}-\d{2}-\d{2})/)
  if (!match) return null
  const d = new Date(match[1] + "T00:00:00Z")
  return isNaN(d.getTime()) ? null : d
}

export function daysOld(date: Date): number {
  const now = Date.now()
  const diff = now - date.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

const LEVEL_PAD = 5

export function formatLine(level: string, msg: string, data?: unknown): string {
  const ts = new Date().toISOString()
  const levelPadded = level.toUpperCase().padEnd(LEVEL_PAD)
  let line = `[${ts}] [${levelPadded}] ${msg}`
  if (data !== undefined) {
    line += ` — ${typeof data === "string" ? data : JSON.stringify(data)}`
  }
  return line
}

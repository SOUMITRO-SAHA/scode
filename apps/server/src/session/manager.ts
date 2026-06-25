import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from "node:fs"
import { join } from "node:path"
import { homedir } from "node:os"
import type { UnifiedMessage } from "../llm/types.js"

const SESSIONS_DIR = join(homedir(), ".scode", "sessions")

export interface Session {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  messages: UnifiedMessage[]
  model: string
  provider: string
}

function ensureDir(): void {
  if (!existsSync(SESSIONS_DIR)) {
    mkdirSync(SESSIONS_DIR, { recursive: true })
  }
}

function sessionPath(id: string): string {
  return join(SESSIONS_DIR, `${id}.json`)
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export class SessionManager {
  create(name: string, model: string, provider: string): Session {
    ensureDir()
    const id = generateId()
    const now = new Date().toISOString()
    const session: Session = {
      id,
      name: name || `Session ${new Date().toLocaleDateString()}`,
      createdAt: now,
      updatedAt: now,
      messages: [],
      model,
      provider,
    }
    writeFileSync(sessionPath(id), JSON.stringify(session, null, 2))
    return session
  }

  get(id: string): Session | null {
    ensureDir()
    const path = sessionPath(id)
    if (!existsSync(path)) return null
    try {
      return JSON.parse(readFileSync(path, "utf-8")) as Session
    } catch {
      return null
    }
  }

  update(session: Session): void {
    ensureDir()
    session.updatedAt = new Date().toISOString()
    writeFileSync(sessionPath(session.id), JSON.stringify(session, null, 2))
  }

  delete(id: string): boolean {
    ensureDir()
    const path = sessionPath(id)
    if (!existsSync(path)) return false
    unlinkSync(path)
    return true
  }

  list(): Session[] {
    ensureDir()
    try {
      const files = readdirSync(SESSIONS_DIR).filter((f) => f.endsWith(".json"))
      return files
        .map((f) => {
          try {
            return JSON.parse(readFileSync(join(SESSIONS_DIR, f), "utf-8")) as Session
          } catch {
            return null
          }
        })
        .filter((s): s is Session => s !== null)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    } catch {
      return []
    }
  }

  addMessage(id: string, message: UnifiedMessage): Session | null {
    const session = this.get(id)
    if (!session) return null
    session.messages.push(message)
    this.update(session)
    return session
  }

  getMessages(id: string): UnifiedMessage[] {
    const session = this.get(id)
    return session?.messages ?? []
  }
}

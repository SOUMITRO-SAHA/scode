import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { join } from "node:path"
import { homedir } from "node:os"
import { mkdirSync, existsSync } from "node:fs"
import * as schema from "./schema"

const DB_PATH = join(homedir(), ".scode", "scode.db")

let _db: ReturnType<typeof drizzle> | null = null

export function getDb() {
  if (!_db) {
    const dir = join(homedir(), ".scode")
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

    const sqlite = new Database(DB_PATH)
    sqlite.pragma("journal_mode = WAL")

    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        model TEXT NOT NULL,
        provider TEXT NOT NULL,
        messages TEXT NOT NULL DEFAULT '[]'
      )
    `)

    _db = drizzle(sqlite, { schema })
  }
  return _db
}

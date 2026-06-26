import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { existsSync, mkdirSync } from "node:fs";

import * as schema from "./schema";

import { SCODE_DB_PATH, SCODE_DIR } from "@scode/shared/constants";

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!_db) {
    if (!existsSync(SCODE_DIR)) mkdirSync(SCODE_DIR, { recursive: true });

    const sqlite = new Database(SCODE_DB_PATH);
    sqlite.pragma("journal_mode = WAL");

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
    `);

    _db = drizzle(sqlite, { schema });
  }
  return _db;
}

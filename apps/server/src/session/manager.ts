import { desc, eq } from "drizzle-orm";

import { getDb } from "../db/client";
import { sessions } from "../db/schema";
import type { UnifiedMessage } from "../llm/types";

export interface Session {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  messages: UnifiedMessage[];
  model: string;
  provider: string;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function rowToSession(row: typeof sessions.$inferSelect): Session {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    model: row.model,
    provider: row.provider,
    messages: JSON.parse(row.messages) as UnifiedMessage[],
  };
}

export class SessionManager {
  create(name: string, model: string, provider: string): Session {
    const id = generateId();
    const now = new Date().toISOString();
    const row = {
      id,
      name: name || `Session ${new Date().toLocaleDateString()}`,
      createdAt: now,
      updatedAt: now,
      model,
      provider,
      messages: "[]",
    };
    getDb().insert(sessions).values(row).run();
    return rowToSession(row);
  }

  get(id: string): Session | null {
    const row = getDb()
      .select()
      .from(sessions)
      .where(eq(sessions.id, id))
      .get();
    if (!row) return null;
    return rowToSession(row);
  }

  update(session: Session): void {
    const now = new Date().toISOString();
    getDb()
      .update(sessions)
      .set({
        name: session.name,
        updatedAt: now,
        model: session.model,
        provider: session.provider,
        messages: JSON.stringify(session.messages),
      })
      .where(eq(sessions.id, session.id))
      .run();
    session.updatedAt = now;
  }

  delete(id: string): boolean {
    const result = getDb().delete(sessions).where(eq(sessions.id, id)).run();
    return result.changes > 0;
  }

  list(): Session[] {
    const rows = getDb()
      .select()
      .from(sessions)
      .orderBy(desc(sessions.updatedAt))
      .all();
    return rows.map(rowToSession);
  }

  addMessage(id: string, message: UnifiedMessage): Session | null {
    const session = this.get(id);
    if (!session) return null;
    session.messages.push(message);
    this.update(session);
    return session;
  }

  getMessages(id: string): UnifiedMessage[] {
    const session = this.get(id);
    return session?.messages ?? [];
  }
}

import { beforeEach, describe, expect, it, vi } from "vitest";

import { getDb } from "../db/client";
import { sessions } from "../db/schema";
import { SessionManager } from "../session/manager";

vi.mock("../db/client", async () => {
  const { default: Database } = await import("better-sqlite3");
  const { drizzle } = await import("drizzle-orm/better-sqlite3");
  const sqlite = new Database(":memory:");
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
  const db = drizzle(sqlite);
  return { getDb: () => db };
});

const baseTime = "2024-01-01T00:00:00.000Z";

function seed(
  rows: Array<{
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    model?: string;
    provider?: string;
    messages?: string;
  }>,
): void {
  const db = getDb();
  for (const r of rows) {
    db.insert(sessions)
      .values({
        id: r.id,
        name: r.name,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        model: r.model ?? "m1",
        provider: r.provider ?? "p1",
        messages: r.messages ?? "[]",
      })
      .run();
  }
}

describe("SessionManager", () => {
  let manager: SessionManager;

  beforeEach(() => {
    getDb().delete(sessions).run();
    manager = new SessionManager();
  });

  describe("cleanupEmpty", () => {
    it("removes sessions with no messages", () => {
      seed([
        {
          id: "empty-1",
          name: "Empty",
          createdAt: baseTime,
          updatedAt: baseTime,
        },
        {
          id: "empty-2",
          name: "Empty2",
          createdAt: baseTime,
          updatedAt: baseTime,
        },
        {
          id: "full-1",
          name: "Full",
          createdAt: baseTime,
          updatedAt: baseTime,
          messages: JSON.stringify([{ role: "user", content: "hi" }]),
        },
      ]);

      const removed = manager.cleanupEmpty();

      expect(removed).toBe(2);
      expect(manager.get("empty-1")).toBeNull();
      expect(manager.get("empty-2")).toBeNull();
      expect(manager.get("full-1")).not.toBeNull();
    });

    it("returns 0 when there are no empty sessions", () => {
      seed([
        {
          id: "full-1",
          name: "Full",
          createdAt: baseTime,
          updatedAt: baseTime,
          messages: JSON.stringify([{ role: "user", content: "hi" }]),
        },
      ]);

      const removed = manager.cleanupEmpty();

      expect(removed).toBe(0);
      expect(manager.list()).toHaveLength(1);
    });

    it("is a no-op on an empty database", () => {
      expect(manager.cleanupEmpty()).toBe(0);
      expect(manager.list()).toHaveLength(0);
    });
  });

  describe("list ordering", () => {
    it("returns sessions ordered by updated_at DESC", () => {
      seed([
        {
          id: "old",
          name: "Old",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
          messages: JSON.stringify([{ role: "user", content: "old" }]),
        },
        {
          id: "new",
          name: "New",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-06-28T12:00:00.000Z",
          messages: JSON.stringify([{ role: "user", content: "new" }]),
        },
        {
          id: "mid",
          name: "Mid",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-03-15T08:00:00.000Z",
          messages: JSON.stringify([{ role: "user", content: "mid" }]),
        },
      ]);

      const list = manager.list();
      expect(list.map((s) => s.id)).toEqual(["new", "mid", "old"]);
    });
  });
});

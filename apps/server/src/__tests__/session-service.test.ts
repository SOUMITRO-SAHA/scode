import { beforeEach, describe, expect, it, vi } from "vitest";

import { Effect } from "effect";

import type { UnifiedMessage } from "../llm/types";
import type { Session } from "../session/manager";
import { SessionService, SessionServiceLive } from "../session/service";

const mockSession: Session = {
  id: "test-session-1",
  name: "Test Session",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  messages: [],
  model: "claude-sonnet-4",
  provider: "claude",
  cwd: "/test/cwd",
};

let sessions = new Map<string, Session>();

let nextId = 0;

vi.mock("../session/manager", () => ({
  SessionManager: class {
    create = vi.fn(
      (name: string, model: string, provider: string, cwd: string) => {
        nextId++;
        const s: Session = {
          id: `test-session-${nextId}`,
          name,
          createdAt: mockSession.createdAt,
          updatedAt: mockSession.updatedAt,
          messages: [],
          model,
          provider,
          cwd,
        };
        sessions.set(s.id, s);
        return s;
      },
    );
    get = vi.fn((id: string) => sessions.get(id) ?? null);
    update = vi.fn((s: Session) => {
      s.updatedAt = new Date().toISOString();
      sessions.set(s.id, s);
    });
    delete = vi.fn((id: string) => sessions.delete(id));
    cleanupEmpty = vi.fn(() => {
      let count = 0;
      for (const [id, s] of sessions) {
        if (s.messages.length === 0) {
          sessions.delete(id);
          count++;
        }
      }
      return count;
    });
    list = vi.fn((_cwd?: string) => Array.from(sessions.values()));
    addMessage = vi.fn((id: string, msg: UnifiedMessage) => {
      const s = sessions.get(id);
      if (!s) return null;
      s.messages.push(msg);
      sessions.set(id, s);
      return s;
    });
    getMessages = vi.fn((id: string) => sessions.get(id)?.messages ?? []);
  },
}));

const runSync = Effect.runSync;

describe("SessionService", () => {
  beforeEach(() => {
    sessions.clear();
    nextId = 0;
  });

  it("is defined with expected methods", () => {
    expect(SessionService.key).toBe("SessionService");
    expect(SessionService.of).toBeDefined();
  });

  it("creates a session via layer", () => {
    const effect = Effect.gen(function* () {
      const svc = yield* SessionService;
      return yield* svc.create("My Chat", "gpt-4", "openai", "/test/cwd");
    });
    const session = runSync(Effect.provide(effect, SessionServiceLive));
    expect(session.name).toBe("My Chat");
    expect(session.model).toBe("gpt-4");
    expect(session.provider).toBe("openai");
  });

  it("retrieves a session by id", () => {
    const effect = Effect.gen(function* () {
      const svc = yield* SessionService;
      const created = yield* svc.create("Test", "m1", "p1", "/test/cwd");
      return yield* svc.get(created.id);
    });
    const session = runSync(Effect.provide(effect, SessionServiceLive));
    expect(session).not.toBeNull();
    expect(session!.name).toBe("Test");
  });

  it("returns null for unknown id", () => {
    const effect = Effect.gen(function* () {
      const svc = yield* SessionService;
      return yield* svc.get("nonexistent");
    });
    const session = runSync(Effect.provide(effect, SessionServiceLive));
    expect(session).toBeNull();
  });

  it("lists all sessions", () => {
    const effect = Effect.gen(function* () {
      const svc = yield* SessionService;
      yield* svc.create("S1", "m1", "p1", "/test/cwd");
      yield* svc.create("S2", "m2", "p2", "/test/cwd");
      return yield* svc.list("/test/cwd");
    });
    const list = runSync(Effect.provide(effect, SessionServiceLive));
    expect(list).toHaveLength(2);
  });

  it("deletes a session", () => {
    const effect = Effect.gen(function* () {
      const svc = yield* SessionService;
      const created = yield* svc.create("Delete Me", "m1", "p1", "/test/cwd");
      const deleted = yield* svc.delete(created.id);
      const after = yield* svc.get(created.id);
      return { deleted, after };
    });
    const result = runSync(Effect.provide(effect, SessionServiceLive));
    expect(result.deleted).toBe(true);
    expect(result.after).toBeNull();
  });

  it("cleans up empty sessions but keeps ones with messages", () => {
    const effect = Effect.gen(function* () {
      const svc = yield* SessionService;
      const empty = yield* svc.create("Empty", "m1", "p1", "/test/cwd");
      yield* svc.create("Also empty", "m2", "p2", "/test/cwd");
      const full = yield* svc.create("Full", "m1", "p1", "/test/cwd");
      yield* svc.addMessage(full.id, { role: "user", content: "hi" });
      const removed = yield* svc.cleanupEmpty;
      const list = yield* svc.list("/test/cwd");
      const emptyGone = (yield* svc.get(empty.id)) === null;
      return {
        removed,
        remaining: list.map((s) => s.id),
        fullId: full.id,
        emptyGone,
      };
    });
    const result = runSync(Effect.provide(effect, SessionServiceLive));
    expect(result.removed).toBe(2);
    expect(result.emptyGone).toBe(true);
    expect(result.remaining).toHaveLength(1);
    expect(result.remaining[0]).toBe(result.fullId);
  });

  it("adds a message to a session", () => {
    const effect = Effect.gen(function* () {
      const svc = yield* SessionService;
      const created = yield* svc.create("Msg Test", "m1", "p1", "/test/cwd");
      yield* svc.addMessage(created.id, {
        role: "user",
        content: "Hello",
      });
      return yield* svc.getMessages(created.id);
    });
    const msgs = runSync(Effect.provide(effect, SessionServiceLive));
    expect(msgs).toHaveLength(1);
    expect(msgs[0].content).toBe("Hello");
  });

  it("updates a session", () => {
    const effect = Effect.gen(function* () {
      const svc = yield* SessionService;
      const created = yield* svc.create("Original", "m1", "p1", "/test/cwd");
      created.name = "Updated";
      yield* svc.update(created);
      return yield* svc.get(created.id);
    });
    const session = runSync(Effect.provide(effect, SessionServiceLive));
    expect(session!.name).toBe("Updated");
  });

  it("auto-renames session on 2nd user message after 1st exchange", () => {
    const effect = Effect.gen(function* () {
      const svc = yield* SessionService;
      const created = yield* svc.create(
        "Session default",
        "m1",
        "p1",
        "/test/cwd",
      );
      yield* svc.addMessage(created.id, {
        role: "user",
        content: "Refactor auth module to use strategy pattern",
      });
      yield* svc.addMessage(created.id, {
        role: "assistant",
        content: "Here's how...",
      });
      yield* svc.addMessage(created.id, {
        role: "user",
        content: "Also add tests",
      });
      const msgs = yield* svc.getMessages(created.id);
      const userMessages = msgs.filter((m) => m.role === "user");
      const assistantMessages = msgs.filter((m) => m.role === "assistant");
      expect(userMessages).toHaveLength(2);
      expect(assistantMessages).toHaveLength(1);
      if (userMessages.length === 2 && assistantMessages.length >= 1) {
        const first =
          typeof userMessages[0].content === "string"
            ? userMessages[0].content
            : "";
        const clean = first.split("\n")[0].trim().slice(0, 60);
        if (clean && clean !== created.name) {
          created.name = clean;
          yield* svc.update(created);
        }
      }
      const updated = yield* svc.get(created.id);
      return updated!;
    });
    const session = runSync(Effect.provide(effect, SessionServiceLive));
    expect(session.name).toBe("Refactor auth module to use strategy pattern");
  });

  it("does NOT auto-rename on 1st message alone", () => {
    const effect = Effect.gen(function* () {
      const svc = yield* SessionService;
      const created = yield* svc.create(
        "My scratch session",
        "m1",
        "p1",
        "/test/cwd",
      );
      yield* svc.addMessage(created.id, {
        role: "user",
        content: "Hello there",
      });
      const msgs = yield* svc.getMessages(created.id);
      const userMessages = msgs.filter((m) => m.role === "user");
      expect(userMessages).toHaveLength(1);
      return yield* svc.get(created.id);
    });
    const session = runSync(Effect.provide(effect, SessionServiceLive));
    expect(session!.name).toBe("My scratch session");
  });

  it("keeps manual rename after messages added", () => {
    const effect = Effect.gen(function* () {
      const svc = yield* SessionService;
      const created = yield* svc.create("Manual name", "m1", "p1", "/test/cwd");
      yield* svc.addMessage(created.id, {
        role: "user",
        content: "Hello world",
      });
      created.name = "My Custom Title";
      yield* svc.update(created);
      const updated = yield* svc.get(created.id);
      return updated!;
    });
    const session = runSync(Effect.provide(effect, SessionServiceLive));
    expect(session.name).toBe("My Custom Title");
  });
});

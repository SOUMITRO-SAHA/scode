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
};

let sessions = new Map<string, Session>();

let nextId = 0;

vi.mock("../session/manager", () => ({
  SessionManager: class {
    create = vi.fn((name: string, model: string, provider: string) => {
      nextId++;
      const s = {
        ...mockSession,
        id: `test-session-${nextId}`,
        name,
        model,
        provider,
      };
      sessions.set(s.id, s);
      return s;
    });
    get = vi.fn((id: string) => sessions.get(id) ?? null);
    update = vi.fn((s: Session) => {
      s.updatedAt = new Date().toISOString();
      sessions.set(s.id, s);
    });
    delete = vi.fn((id: string) => sessions.delete(id));
    list = vi.fn(() => Array.from(sessions.values()));
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
      return yield* svc.create("My Chat", "gpt-4", "openai");
    });
    const session = runSync(Effect.provide(effect, SessionServiceLive));
    expect(session.name).toBe("My Chat");
    expect(session.model).toBe("gpt-4");
    expect(session.provider).toBe("openai");
  });

  it("retrieves a session by id", () => {
    const effect = Effect.gen(function* () {
      const svc = yield* SessionService;
      const created = yield* svc.create("Test", "m1", "p1");
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
      yield* svc.create("S1", "m1", "p1");
      yield* svc.create("S2", "m2", "p2");
      return yield* svc.list;
    });
    const list = runSync(Effect.provide(effect, SessionServiceLive));
    expect(list).toHaveLength(2);
  });

  it("deletes a session", () => {
    const effect = Effect.gen(function* () {
      const svc = yield* SessionService;
      const created = yield* svc.create("Delete Me", "m1", "p1");
      const deleted = yield* svc.delete(created.id);
      const after = yield* svc.get(created.id);
      return { deleted, after };
    });
    const result = runSync(Effect.provide(effect, SessionServiceLive));
    expect(result.deleted).toBe(true);
    expect(result.after).toBeNull();
  });

  it("adds a message to a session", () => {
    const effect = Effect.gen(function* () {
      const svc = yield* SessionService;
      const created = yield* svc.create("Msg Test", "m1", "p1");
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
      const created = yield* svc.create("Original", "m1", "p1");
      created.name = "Updated";
      yield* svc.update(created);
      return yield* svc.get(created.id);
    });
    const session = runSync(Effect.provide(effect, SessionServiceLive));
    expect(session!.name).toBe("Updated");
  });
});

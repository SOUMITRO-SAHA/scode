import { describe, expect, it } from "vitest";

import type { Message, SessionInfo } from "../types";

describe("type re-exports", () => {
  it("Message type is assignable", () => {
    const msg: Message = { role: "user", content: "hello" };
    expect(msg.role).toBe("user");
  });

  it("SessionInfo type is assignable", () => {
    const s: SessionInfo = {
      id: "s1",
      name: "test",
      createdAt: "2025-01-01",
      updatedAt: "2025-01-01",
      messageCount: 1,
      model: "claude",
      provider: "anthropic",
    };
    expect(s.id).toBe("s1");
  });
});

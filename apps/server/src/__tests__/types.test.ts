import { describe, expect, it } from "vitest";

import type { ToolCall, ToolDefinition } from "../types";

describe("server types", () => {
  it("ToolDefinition is assignable", () => {
    const def: ToolDefinition = {
      name: "test",
      description: "A test tool",
      inputSchema: {
        type: "object",
        properties: { x: { type: "string" } },
        required: ["x"],
      },
    };
    expect(def.name).toBe("test");
  });

  it("ToolCall is assignable", () => {
    const call: ToolCall = {
      id: "call-1",
      name: "echo",
      input: { message: "hello" },
    };
    expect(call.id).toBe("call-1");
  });
});

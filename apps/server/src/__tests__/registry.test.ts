import { describe, expect, it } from "vitest";

import { Registry } from "../tool/registry";
import type { ToolDefinition } from "../types";

function def(name: string): ToolDefinition {
  return {
    name,
    description: `Tool ${name}`,
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  };
}

describe("Registry", () => {
  it("registers a tool and returns its definition", () => {
    const reg = new Registry();
    reg.register("echo", def("echo"), async (input) => input);
    const defs = reg.definitions();
    expect(defs).toHaveLength(1);
    expect(defs[0].name).toBe("echo");
  });

  it("settles a tool call and returns handler result", async () => {
    const reg = new Registry();
    reg.register("echo", def("echo"), async (input) => input);
    const result = await reg.settle({
      name: "echo",
      input: { message: "hello" },
    });
    expect(result).toEqual({ message: "hello" });
  });

  it("throws on unknown tool", async () => {
    const reg = new Registry();
    await expect(reg.settle({ name: "unknown", input: {} })).rejects.toThrow(
      "Unknown tool: unknown",
    );
  });

  it("registers multiple tools", () => {
    const reg = new Registry();
    reg.register("a", def("a"), async () => "a");
    reg.register("b", def("b"), async () => "b");
    reg.register("c", def("c"), async () => "c");
    expect(reg.definitions()).toHaveLength(3);
  });
});

import { describe, expect, it } from "vitest";

import { Effect, Schema } from "effect";

import { Tool } from "../tool/core";
import { ToolRegistry } from "../tool/registry";

const runPromise = Effect.runPromise;

describe("ToolRegistry", () => {
  it("registers a tool and returns its definition", () => {
    const reg = new ToolRegistry();
    const t = Tool.make({
      name: "echo",
      description: "Tool echo",
      input: Schema.Struct({}),
      output: Schema.Struct({}),
      execute: (input) => Effect.succeed(input),
    });
    reg.register(t);
    const defs = reg.definitions();
    expect(defs).toHaveLength(1);
    expect(defs[0].name).toBe("echo");
  });

  it("settles a tool call and returns handler result", async () => {
    const reg = new ToolRegistry();
    const t = Tool.make({
      name: "echo",
      description: "Tool echo",
      input: Schema.Struct({
        message: Schema.String,
      }),
      output: Schema.Struct({
        message: Schema.String,
      }),
      execute: (input) => Effect.succeed(input),
    });
    reg.register(t);
    const result = await runPromise(
      reg.settle({ name: "echo", input: { message: "hello" } }),
    );
    expect(result).toEqual({ message: "hello" });
  });

  it("fails on unknown tool", async () => {
    const reg = new ToolRegistry();
    await expect(
      runPromise(reg.settle({ name: "unknown", input: {} })),
    ).rejects.toThrow("Unknown tool: unknown");
  });

  it("registers multiple tools", () => {
    const reg = new ToolRegistry();
    const t1 = Tool.make({
      name: "a",
      description: "Tool a",
      input: Schema.Struct({}),
      output: Schema.Struct({}),
      execute: () => Effect.succeed("a"),
    });
    const t2 = Tool.make({
      name: "b",
      description: "Tool b",
      input: Schema.Struct({}),
      output: Schema.Struct({}),
      execute: () => Effect.succeed("b"),
    });
    const t3 = Tool.make({
      name: "c",
      description: "Tool c",
      input: Schema.Struct({}),
      output: Schema.Struct({}),
      execute: () => Effect.succeed("c"),
    });
    reg.register(t1);
    reg.register(t2);
    reg.register(t3);
    expect(reg.definitions()).toHaveLength(3);
  });
});

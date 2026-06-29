import { Effect, Schema } from "effect";

import type { ToolDefinition } from "../types";

import { ToolFailure, schemaToJsonSchema } from "@scode/shared/effect";

const toolOpaque: unique symbol = Symbol("ToolOpaque");

export type ToolOpaque = typeof toolOpaque;

export interface AnyTool {
  readonly [toolOpaque]: typeof toolOpaque;
}

interface ToolEntry<Input, Output> {
  name: string;
  description: string;
  input: Schema.Schema<Input>;
  output: Schema.Schema<Output>;
  execute: (input: Input) => Effect.Effect<Output, ToolFailure>;
}

const entries = new WeakMap<object, ToolEntry<unknown, unknown>>();

export namespace Tool {
  export function make<Input extends Record<string, unknown>, Output>(config: {
    name: string;
    description: string;
    input: Schema.Schema<Input>;
    output: Schema.Schema<Output>;
    execute: (input: Input) => Effect.Effect<Output, ToolFailure>;
  }): AnyTool {
    const self: AnyTool = { [toolOpaque]: toolOpaque };
    entries.set(self, config as unknown as ToolEntry<unknown, unknown>);
    return self;
  }

  export function getEntry(
    self: AnyTool,
  ): ToolEntry<unknown, unknown> | undefined {
    return entries.get(self);
  }

  export function settle(
    self: AnyTool,
    call: { id: string; name: string; input: unknown },
  ): Effect.Effect<unknown, ToolFailure> {
    const entry = entries.get(self);
    if (!entry) {
      return Effect.fail(new ToolFailure({ error: `Unknown tool` }));
    }
    return Effect.gen(function* () {
      const decoded = yield* Schema.decodeUnknownEffect(
        entry.input as Schema.Schema<unknown>,
      )(call.input).pipe(
        Effect.catch((parseErr) =>
          Effect.fail(
            new ToolFailure({ error: `Invalid input: ${String(parseErr)}` }),
          ),
        ),
      );
      const result = yield* entry.execute(decoded as Record<string, unknown>);
      return result;
    }).pipe(Effect.map((v) => v)) as Effect.Effect<unknown, ToolFailure, never>;
  }

  export function toDefinition(self: AnyTool): ToolDefinition {
    const entry = entries.get(self);
    if (!entry) {
      return { name: "unknown", description: "", inputSchema: {} };
    }
    return {
      name: entry.name,
      description: entry.description,
      inputSchema: schemaToJsonSchema(
        entry.input as unknown as Schema.Schema<unknown>,
      ),
    };
  }
}

/** Convenience: run a tool's execute with raw input and throw on ToolFailure */
export function runTool<Output>(
  tool: AnyTool,
  input: Record<string, unknown>,
): Promise<Output> {
  return Effect.runPromise(
    Tool.settle(tool, { id: "run", name: "tool", input }),
  ).catch((err) => {
    if (err instanceof ToolFailure) {
      throw new Error(err.error);
    }
    throw err;
  }) as Promise<Output>;
}

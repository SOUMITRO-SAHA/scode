import { Effect } from "effect";

import { ToolFailure } from "../llm/error";
import type { ToolCall, ToolDefinition, ToolHandler } from "../types";

export interface ToolEntry {
  definition: ToolDefinition;
  handler: ToolHandler;
}

export class ToolRegistry {
  private tools = new Map<string, ToolEntry>();

  register(
    name: string,
    definition: ToolDefinition,
    handler: ToolHandler,
  ): void {
    this.tools.set(name, { definition, handler });
  }

  definitions(): ToolDefinition[] {
    return [...this.tools.values()].map((t) => t.definition);
  }

  settle(call: ToolCall): Effect.Effect<unknown, ToolFailure> {
    const tool = this.tools.get(call.name);
    if (!tool) {
      return Effect.fail(
        new ToolFailure({ error: `Unknown tool: ${call.name}` }),
      );
    }
    return Effect.tryPromise({
      try: () => tool.handler(call.input),
      catch: (err) =>
        new ToolFailure({
          error: err instanceof Error ? err.message : String(err),
        }),
    });
  }
}

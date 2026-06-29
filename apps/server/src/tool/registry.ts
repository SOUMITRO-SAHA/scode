import { Effect } from "effect";

import type { ToolCall, ToolDefinition } from "../types";
import type { AnyTool } from "./core";
import { Tool } from "./core";

import { ToolFailure } from "@scode/shared/effect";

export class ToolRegistry {
  private tools = new Map<string, AnyTool>();

  register(tool: AnyTool): void {
    const entry = Tool.getEntry(tool);
    if (entry) {
      this.tools.set(entry.name, tool);
    }
  }

  definitions(): ToolDefinition[] {
    return [...this.tools.values()].map((t) => Tool.toDefinition(t));
  }

  settle(call: ToolCall): Effect.Effect<unknown, ToolFailure> {
    const tool = this.tools.get(call.name);
    if (!tool) {
      return Effect.fail(
        new ToolFailure({ error: `Unknown tool: ${call.name}` }),
      );
    }
    return Tool.settle(tool, call);
  }
}

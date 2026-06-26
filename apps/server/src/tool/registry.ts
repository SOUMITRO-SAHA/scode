import type { Tool, ToolCall, ToolDefinition, ToolHandler } from "../types";

export class Registry {
  private tools = new Map<string, Tool>();

  register(
    name: string,
    definition: ToolDefinition,
    handler: ToolHandler,
  ): void {
    this.tools.set(name, { definition, handler });
  }

  definitions(): ToolDefinition[] {
    const defs: ToolDefinition[] = [];
    for (const tool of this.tools.values()) {
      defs.push(tool.definition);
    }
    return defs;
  }

  async settle(call: ToolCall): Promise<unknown> {
    const tool = this.tools.get(call.name);
    if (!tool) throw new Error(`Unknown tool: ${call.name}`);
    return tool.handler(call.input);
  }
}

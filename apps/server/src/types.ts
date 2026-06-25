export interface Skill {
  name: string
  description: string
  body: string
}

export interface ToolDefinition {
  name: string
  description: string
  inputSchema: Record<string, unknown>
}

export interface ToolCall {
  id: string
  name: string
  input: Record<string, unknown>
}

export type ToolHandler = (input: Record<string, unknown>) => Promise<unknown>

export interface Tool {
  definition: ToolDefinition
  handler: ToolHandler
}

export type StreamEvent =
  | { type: "text"; delta: string }
  | { type: "tool_use"; toolCall: ToolCall }
  | { type: "done" }

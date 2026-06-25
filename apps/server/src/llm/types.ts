export interface UnifiedMessage {
  role: "system" | "user" | "assistant" | "tool"
  content: string | ContentBlock[]
  tool_call_id?: string
  name?: string
}

export type ContentBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
  | { type: "tool_result"; tool_use_id: string; content: string }

import type { StreamEvent, ToolDefinition } from "../types.js"
import type { UnifiedMessage } from "./types.js"

export interface LLMProvider {
  readonly id: string
  readonly name: string
  readonly defaultModel: string

  streamResponse(params: {
    system: string
    messages: UnifiedMessage[]
    tools: ToolDefinition[]
    model?: string
    apiKey: string
  }): AsyncGenerator<StreamEvent>
}

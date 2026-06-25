import Anthropic from "@anthropic-ai/sdk"
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages/messages.js"
import type { LLMProvider } from "../provider.js"
import type { UnifiedMessage } from "../types.js"

export class ClaudeAdapter implements LLMProvider {
  readonly id = "claude"
  readonly name = "Anthropic Claude"
  readonly defaultModel = "claude-sonnet-4-20250515"

  async *streamResponse(
    params: Parameters<LLMProvider["streamResponse"]>[0],
  ): ReturnType<LLMProvider["streamResponse"]> {
    const client = new Anthropic({ apiKey: params.apiKey })
    const model = params.model ?? this.defaultModel

    const messages = toAnthropicMessages(params.messages)

    const stream = client.messages.stream({
      model,
      max_tokens: 8192,
      system: params.system,
      messages,
      tools: toAnthropicTools(params.tools),
    })

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        yield { type: "text", delta: event.delta.text }
      }
    }

    const finalMessage = await stream.finalMessage()

    for (const block of finalMessage.content) {
      if (block.type === "tool_use") {
        yield {
          type: "tool_use",
          toolCall: { id: block.id, name: block.name, input: block.input as Record<string, unknown> },
        }
      }
    }

    yield { type: "done" }
  }
}

function toAnthropicTools(tools: Parameters<LLMProvider["streamResponse"]>[0]["tools"]): Anthropic.Tool[] {
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.inputSchema as Anthropic.Tool.InputSchema,
  }))
}

function toAnthropicMessages(messages: UnifiedMessage[]): MessageParam[] {
  const result: MessageParam[] = []
  for (const msg of messages) {
    if (msg.role === "system") continue
    if (msg.role === "tool") {
      result.push({
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: msg.tool_call_id!,
            content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
          },
        ],
      })
    } else if (msg.role === "assistant" && Array.isArray(msg.content)) {
      const blocks = msg.content.map((b) => {
        if (b.type === "tool_use") return { type: "tool_use" as const, id: b.id, name: b.name, input: b.input }
        if (b.type === "text") return { type: "text" as const, text: b.text }
        return { type: "text" as const, text: JSON.stringify(b) }
      })
      result.push({ role: "assistant", content: blocks })
    } else if (msg.role === "assistant") {
      result.push({ role: "assistant", content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content) })
    } else {
      result.push({ role: "user", content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content) })
    }
  }
  return result
}

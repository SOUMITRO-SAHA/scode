import Anthropic from "@anthropic-ai/sdk"
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages/messages.js"
import type { ToolDefinition, StreamEvent, ToolCall } from "../types.js"

const MODEL = "claude-sonnet-4-20250515"

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || apiKey === "sk-ant-...") {
    throw new Error("ANTHROPIC_API_KEY not set or still placeholder")
  }
  return new Anthropic({ apiKey })
}

function toAnthropicTools(tools: ToolDefinition[]): Anthropic.Tool[] {
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.inputSchema as Anthropic.Tool.InputSchema,
  }))
}

export async function* streamResponse(params: {
  system: string
  messages: MessageParam[]
  tools: ToolDefinition[]
}): AsyncGenerator<StreamEvent> {
  const client = getClient()

  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 8192,
    system: params.system,
    messages: params.messages,
    tools: toAnthropicTools(params.tools),
  })

  let finalMessage: Anthropic.Message | null = null

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      yield { type: "text", delta: event.delta.text }
    }
  }

  finalMessage = await stream.finalMessage()

  for (const block of finalMessage.content) {
    if (block.type === "tool_use") {
      yield {
        type: "tool_use",
        toolCall: {
          id: block.id,
          name: block.name,
          input: block.input as Record<string, unknown>,
        },
      }
    }
  }

  yield { type: "done" }
}

import type { LLMProvider } from "../provider";
import type { UnifiedMessage } from "../types";

import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import { EFFORT_LEVELS, EFFORT_THINKING_BUDGET } from "@scode/shared/constants";
import type { EffortLevel } from "@scode/shared/types";

function claudeSupportsThinking(model: string): boolean {
  const id = model.toLowerCase();
  return (
    id.includes("sonnet-4") ||
    id.includes("opus-4") ||
    /\bclaude-4(?!-5)\b/.test(id) ||
    id.includes("fable-5")
  );
}

export class ClaudeAdapter implements LLMProvider {
  readonly id = "claude";
  readonly name = "Anthropic Claude";
  readonly defaultModel = "claude-sonnet-4-20250515";

  async listModels(apiKey: string): Promise<string[]> {
    try {
      const client = new Anthropic({ apiKey });
      const models: string[] = [];
      for await (const model of client.models.list()) {
        models.push(model.id);
      }
      return models.length > 0 ? models : [this.defaultModel];
    } catch {
      return [this.defaultModel];
    }
  }

  getSupportedEfforts(model?: string): EffortLevel[] {
    const m = model ?? this.defaultModel;
    if (claudeSupportsThinking(m)) return EFFORT_LEVELS;
    return [];
  }

  async *streamResponse(
    params: Parameters<LLMProvider["streamResponse"]>[0],
  ): ReturnType<LLMProvider["streamResponse"]> {
    const client = new Anthropic({ apiKey: params.apiKey });
    const model = params.model ?? this.defaultModel;

    const messages = toAnthropicMessages(params.messages);
    const supportsThinking = claudeSupportsThinking(model);
    const effortLevel = supportsThinking ? params.effortLevel : undefined;
    const budgetTokens = EFFORT_THINKING_BUDGET[effortLevel ?? "none"];

    const maxTokens = budgetTokens
      ? Math.min(budgetTokens + 4096, 64000)
      : 8192;

    const stream = client.messages.stream({
      model,
      max_tokens: maxTokens,
      system: params.system,
      messages,
      tools: toAnthropicTools(params.tools),
      ...(budgetTokens
        ? {
            thinking: {
              type: "enabled",
              budget_tokens: budgetTokens,
            },
          }
        : {}),
    });

    // Track tool calls by content block index to accumulate input_json_delta
    const toolCallByIndex = new Map<
      number,
      { id: string; name: string; inputJson: string }
    >();
    const yieldedToolCallIds = new Set<string>();

    for await (const event of stream) {
      if (
        event.type === "content_block_start" &&
        event.content_block.type === "tool_use"
      ) {
        yieldedToolCallIds.add(event.content_block.id);
        toolCallByIndex.set(event.index, {
          id: event.content_block.id,
          name: event.content_block.name,
          inputJson: "",
        });
      }
      if (event.type === "content_block_delta") {
        if (event.delta.type === "text_delta") {
          yield { type: "text", delta: event.delta.text };
        } else if (event.delta.type === "thinking_delta") {
          yield { type: "thought", text: event.delta.thinking };
        } else if (event.delta.type === "input_json_delta") {
          const tracked = toolCallByIndex.get(event.index);
          if (tracked) {
            tracked.inputJson += event.delta.partial_json ?? "";
          }
        }
      }
      if (event.type === "content_block_stop") {
        const tracked = toolCallByIndex.get(event.index);
        if (tracked) {
          let input: Record<string, unknown> = {};
          try {
            input = tracked.inputJson ? JSON.parse(tracked.inputJson) : {};
          } catch {
            input = {};
          }
          yield {
            type: "tool_use",
            toolCall: {
              id: tracked.id,
              name: tracked.name,
              input,
            },
          };
          toolCallByIndex.delete(event.index);
        }
      }
    }

    const finalMessage = await stream.finalMessage();

    // Fallback: yield any tool_use blocks not caught during streaming
    for (const block of finalMessage.content) {
      if (block.type === "tool_use" && !yieldedToolCallIds.has(block.id)) {
        yield {
          type: "tool_use",
          toolCall: {
            id: block.id,
            name: block.name,
            input: block.input as Record<string, unknown>,
          },
        };
      }
    }

    yield { type: "done" };
  }
}

function toAnthropicTools(
  tools: Parameters<LLMProvider["streamResponse"]>[0]["tools"],
): Anthropic.Tool[] {
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.inputSchema as Anthropic.Tool.InputSchema,
  }));
}

function toAnthropicMessages(messages: UnifiedMessage[]): MessageParam[] {
  const result: MessageParam[] = [];
  for (const msg of messages) {
    if (msg.role === "system") continue;
    if (msg.role === "tool") {
      result.push({
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: msg.tool_call_id!,
            content:
              typeof msg.content === "string"
                ? msg.content
                : JSON.stringify(msg.content),
          },
        ],
      });
    } else if (msg.role === "assistant" && Array.isArray(msg.content)) {
      const blocks = msg.content.map((b) => {
        if (b.type === "tool_use")
          return {
            type: "tool_use" as const,
            id: b.id,
            name: b.name,
            input: b.input,
          };
        if (b.type === "text") return { type: "text" as const, text: b.text };
        return { type: "text" as const, text: JSON.stringify(b) };
      });
      result.push({ role: "assistant", content: blocks });
    } else if (msg.role === "assistant") {
      result.push({
        role: "assistant",
        content:
          typeof msg.content === "string"
            ? msg.content
            : JSON.stringify(msg.content),
      });
    } else {
      result.push({
        role: "user",
        content:
          typeof msg.content === "string"
            ? msg.content
            : JSON.stringify(msg.content),
      });
    }
  }
  return result;
}

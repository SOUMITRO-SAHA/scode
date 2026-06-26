import { CohereClientV2 } from "cohere-ai";

import type { LLMProvider } from "../provider";
import type { UnifiedMessage } from "../types";

export class CohereAdapter implements LLMProvider {
  readonly id = "cohere";
  readonly name = "Cohere Command";
  readonly defaultModel = "command-a-03-2025";

  async *streamResponse(
    params: Parameters<LLMProvider["streamResponse"]>[0],
  ): ReturnType<LLMProvider["streamResponse"]> {
    const client = new CohereClientV2({ token: params.apiKey });
    const model = params.model ?? this.defaultModel;

    const stream = await client.chatStream({
      model,
      messages: toCohereMessages(params.messages, params.system) as any,
      tools: toCohereTools(params.tools) as any,
    });

    const toolCallAccumulators: Map<
      number,
      { id: string; name: string; arguments: string }
    > = new Map();

    for await (const event of stream) {
      if (event.type === "content-delta") {
        const text = (event as any).delta?.message?.content?.text;
        if (text) {
          yield { type: "text", delta: text };
        }
      }

      if (event.type === "tool-call-start") {
        const e = event as any;
        const idx = e.index ?? 0;
        const tc = e.delta?.message?.toolCalls?.[0];
        if (tc) {
          toolCallAccumulators.set(idx, {
            id: tc.id ?? "",
            name: tc.function?.name ?? "",
            arguments: "",
          });
        }
      }

      if (event.type === "tool-call-delta") {
        const e = event as any;
        const idx = e.index ?? 0;
        const acc = toolCallAccumulators.get(idx);
        if (acc) {
          const argDelta =
            e.delta?.message?.toolCalls?.[0]?.function?.arguments ?? "";
          acc.arguments += argDelta;
        }
      }
    }

    for (const acc of toolCallAccumulators.values()) {
      if (!acc.name) continue;
      let input: Record<string, unknown> = {};
      try {
        input = JSON.parse(acc.arguments);
      } catch {
        input = { raw: acc.arguments };
      }
      yield {
        type: "tool_use",
        toolCall: {
          id: acc.id || acc.name,
          name: acc.name,
          input,
        },
      };
    }

    yield { type: "done" };
  }
}

function toCohereTools(
  tools: Parameters<LLMProvider["streamResponse"]>[0]["tools"],
) {
  return tools.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.inputSchema as Record<string, unknown>,
    },
  }));
}

function toCohereMessages(
  messages: UnifiedMessage[],
  system: string,
): Record<string, unknown>[] {
  const result: Record<string, unknown>[] = [];

  result.push({ role: "system", content: system });

  for (const msg of messages) {
    if (msg.role === "system") continue;

    if (msg.role === "tool") {
      result.push({
        role: "tool",
        tool_call_id: msg.tool_call_id ?? "",
        content:
          typeof msg.content === "string"
            ? msg.content
            : JSON.stringify(msg.content),
      });
      continue;
    }

    if (msg.role === "assistant") {
      const text =
        typeof msg.content === "string"
          ? msg.content
          : (msg.content.find((b) => b.type === "text")?.text ?? "");

      const toolCalls = Array.isArray(msg.content)
        ? msg.content
            .filter(
              (
                b,
              ): b is {
                type: "tool_use";
                id: string;
                name: string;
                input: Record<string, unknown>;
              } => b.type === "tool_use",
            )
            .map((b) => ({
              id: b.id,
              type: "function" as const,
              function: { name: b.name, arguments: JSON.stringify(b.input) },
            }))
        : undefined;

      result.push({
        role: "assistant",
        content: text || undefined,
        tool_calls: toolCalls && toolCalls.length > 0 ? toolCalls : undefined,
      });
      continue;
    }

    result.push({
      role: "user",
      content:
        typeof msg.content === "string"
          ? msg.content
          : JSON.stringify(msg.content),
    });
  }

  return result;
}

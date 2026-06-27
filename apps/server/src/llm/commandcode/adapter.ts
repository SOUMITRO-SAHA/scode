import type { LLMProvider } from "../provider";
import type { UnifiedMessage } from "../types";

const BASE_URL = "https://api.commandcode.ai/provider/v1";

interface OpenAIChunk {
  choices?: {
    delta?: {
      content?: string;
      tool_calls?: {
        index: number;
        id?: string;
        function?: { name?: string; arguments?: string };
      }[];
    };
    finish_reason?: string;
  }[];
}

export class CommandCodeAdapter implements LLMProvider {
  readonly id = "commandcode";
  readonly name = "commandcode";
  readonly defaultModel = "deepseek/deepseek-v4-flash";

  async *streamResponse(
    params: Parameters<LLMProvider["streamResponse"]>[0],
  ): ReturnType<LLMProvider["streamResponse"]> {
    const model = params.model ?? this.defaultModel;

    const body = {
      model,
      messages: toOpenAIMessages(params.messages, params.system),
      tools: params.tools.length > 0 ? toOpenAITools(params.tools) : undefined,
      stream: true,
      stream_options: { include_usage: true },
    };

    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`CommandCode API error ${res.status}: ${err}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    const toolCallAccumulators: Map<
      number,
      { id: string; name: string; arguments: string }
    > = new Map();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);
        if (data === "[DONE]") continue;

        let chunk: OpenAIChunk;
        try {
          chunk = JSON.parse(data);
        } catch {
          continue;
        }

        const choice = chunk.choices?.[0];
        if (!choice?.delta) continue;

        if (choice.delta.content) {
          yield { type: "text", delta: choice.delta.content };
        }

        if (choice.delta.tool_calls) {
          for (const tc of choice.delta.tool_calls) {
            const idx = tc.index;
            if (tc.id) {
              toolCallAccumulators.set(idx, {
                id: tc.id,
                name: tc.function?.name ?? "",
                arguments: "",
              });
            }
            const acc = toolCallAccumulators.get(idx);
            if (acc) {
              if (tc.function?.name && !acc.name) {
                acc.name = tc.function.name;
              }
              if (tc.function?.arguments) {
                acc.arguments += tc.function.arguments;
              }
            }
          }
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

function toOpenAITools(
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

function toOpenAIMessages(
  messages: UnifiedMessage[],
  system: string,
): Record<string, unknown>[] {
  const result: Record<string, unknown>[] = [];

  if (system) {
    result.push({ role: "system", content: system });
  }

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

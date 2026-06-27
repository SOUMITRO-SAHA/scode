import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

import type { LLMProvider } from "../provider";
import type { UnifiedMessage } from "../types";

import type { EffortLevel } from "@scode/shared/types";

export interface OpenAICompatConfig {
  id: string;
  name: string;
  defaultModel: string;
  baseURL: string;
}

export class OpenAICompatAdapter implements LLMProvider {
  readonly id: string;
  readonly name: string;
  readonly defaultModel: string;
  private baseURL: string;

  constructor(config: OpenAICompatConfig) {
    this.id = config.id;
    this.name = config.name;
    this.defaultModel = config.defaultModel;
    this.baseURL = config.baseURL;
  }

  async listModels(apiKey: string): Promise<string[]> {
    try {
      const client = new OpenAI({ apiKey, baseURL: this.baseURL });
      const models: string[] = [];
      for await (const model of client.models.list()) {
        models.push(model.id);
      }
      return models.length > 0 ? models : [this.defaultModel];
    } catch {
      return [this.defaultModel];
    }
  }

  async *streamResponse(
    params: Parameters<LLMProvider["streamResponse"]>[0],
  ): ReturnType<LLMProvider["streamResponse"]> {
    const client = new OpenAI({ apiKey: params.apiKey, baseURL: this.baseURL });
    const model = params.model ?? this.defaultModel;

    const stream = await client.chat.completions.create({
      model,
      messages: toOpenAIMessages(params.messages, params.system),
      tools: toOpenAITools(params.tools),
      stream: true,
      max_tokens: 8192,
      ...(params.effortLevel ? { reasoning_effort: params.effortLevel } : {}),
    });

    const toolCallAccumulators: Map<
      number,
      { id: string; name: string; arguments: string }
    > = new Map();

    for await (const chunk of stream) {
      const choice = chunk.choices?.[0];
      if (!choice) continue;

      if (choice.delta?.content) {
        yield { type: "text", delta: choice.delta.content };
      }

      if (choice.delta?.tool_calls) {
        for (const tc of choice.delta.tool_calls) {
          const idx = tc.index;
          if (!toolCallAccumulators.has(idx)) {
            toolCallAccumulators.set(idx, {
              id: tc.id ?? "",
              name: "",
              arguments: "",
            });
          }
          const acc = toolCallAccumulators.get(idx)!;
          if (tc.id) acc.id = tc.id;
          if (tc.function?.name) acc.name += tc.function.name;
          if (tc.function?.arguments) acc.arguments += tc.function.arguments;
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
): ChatCompletionMessageParam[] {
  const result: ChatCompletionMessageParam[] = [];

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

      const text =
        typeof msg.content === "string"
          ? msg.content
          : (msg.content.find((b) => b.type === "text")?.text ?? "");

      result.push({
        role: "assistant",
        content: text || null,
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

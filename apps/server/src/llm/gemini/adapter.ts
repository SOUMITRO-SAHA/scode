import type { LLMProvider } from "../provider";
import type { UnifiedMessage } from "../types";

import { GoogleGenAI } from "@google/genai";
import type {
  Content,
  FunctionCall,
  FunctionDeclaration,
  Part,
} from "@google/genai";
import { EFFORT_THINKING_BUDGET } from "@scode/shared/constants";
import type { EffortLevel } from "@scode/shared/types";

function geminiEfforts(modelId: string): EffortLevel[] {
  const id = modelId.toLowerCase();
  if (!id.includes("gemini-3") && !id.includes("gemini-2.5")) return [];
  if (id.includes("gemini-3")) {
    if (id.includes("flash-image")) return ["minimal", "high"];
    if (id.includes("pro-image")) return ["high"];
    if (id.includes("flash")) return ["minimal", "low", "medium", "high"];
    return ["low", "medium", "high"];
  }
  return ["low", "high"];
}

export class GeminiAdapter implements LLMProvider {
  readonly id = "gemini";
  readonly name = "Google Gemini";
  readonly defaultModel = "gemini-2.5-flash";

  async listModels(apiKey: string): Promise<string[]> {
    try {
      const client = new GoogleGenAI({ apiKey });
      const pager = await client.models.list();
      const models: string[] = [];
      for await (const model of pager) {
        if (model.name) {
          models.push(model.name.replace(/^models\//, ""));
        }
      }
      return models.length > 0 ? models : [this.defaultModel];
    } catch {
      return [this.defaultModel];
    }
  }

  getSupportedEfforts(model?: string): EffortLevel[] {
    return geminiEfforts(model ?? this.defaultModel);
  }

  async *streamResponse(
    params: Parameters<LLMProvider["streamResponse"]>[0],
  ): ReturnType<LLMProvider["streamResponse"]> {
    const client = new GoogleGenAI({ apiKey: params.apiKey });
    const model = params.model ?? this.defaultModel;
    const { systemInstruction, contents } = toGeminiContents(params.messages);
    const efforts = geminiEfforts(model);
    const effortLevel = efforts.includes(params.effortLevel ?? "none")
      ? params.effortLevel
      : undefined;
    const thinkingBudget = EFFORT_THINKING_BUDGET[effortLevel ?? "none"];

    const stream = await client.models.generateContentStream({
      model,
      contents,
      config: {
        systemInstruction: systemInstruction
          ? { role: "user", parts: [{ text: systemInstruction }] }
          : undefined,
        tools: [
          {
            functionDeclarations: toGeminiTools(params.tools),
          },
        ],
        ...(thinkingBudget
          ? {
              thinkingConfig: {
                thinkingBudget,
              },
            }
          : {}),
      },
    });

    for await (const chunk of stream) {
      const parts = chunk.candidates?.[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.thought && part.text) {
            yield { type: "thought", text: part.text };
          } else if (part.text) {
            yield { type: "text", delta: part.text };
          }
        }
      }
      if (chunk.functionCalls) {
        for (let i = 0; i < chunk.functionCalls.length; i++) {
          const fc = chunk.functionCalls[i];
          yield {
            type: "tool_use",
            toolCall: {
              id: `${fc.name ?? ""}-${Date.now()}-${i}`,
              name: fc.name ?? "",
              input: (fc.args ?? {}) as Record<string, unknown>,
            },
          };
        }
      }
    }

    yield { type: "done" };
  }
}

function toGeminiTools(
  tools: Parameters<LLMProvider["streamResponse"]>[0]["tools"],
): FunctionDeclaration[] {
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    parametersJsonSchema: t.inputSchema as Record<string, unknown>,
  }));
}

function buildFunctionNameMap(messages: UnifiedMessage[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const msg of messages) {
    if (msg.role === "assistant" && Array.isArray(msg.content)) {
      for (const block of msg.content) {
        if (block.type === "tool_use") {
          map.set(block.id, block.name);
        }
      }
    }
  }
  return map;
}

function toGeminiContents(messages: UnifiedMessage[]): {
  systemInstruction: string | undefined;
  contents: Content[];
} {
  let systemInstruction: string | undefined;
  const contents: Content[] = [];
  const fnNameMap = buildFunctionNameMap(messages);

  for (const msg of messages) {
    if (msg.role === "system") {
      systemInstruction =
        typeof msg.content === "string"
          ? msg.content
          : msg.content.map((b) => ("text" in b ? b.text : "")).join("");
      continue;
    }

    if (msg.role === "tool") {
      const toolCallId = msg.tool_call_id ?? "";
      const content =
        typeof msg.content === "string"
          ? msg.content
          : JSON.stringify(msg.content);
      contents.push({
        role: "user",
        parts: [
          {
            functionResponse: {
              name: fnNameMap.get(toolCallId) ?? toolCallId,
              response: { result: content },
            },
          },
        ],
      });
      continue;
    }

    if (msg.role === "assistant") {
      const parts: Part[] = [];
      if (typeof msg.content === "string") {
        parts.push({ text: msg.content });
      } else {
        for (const block of msg.content) {
          if (block.type === "text") {
            parts.push({ text: block.text });
          } else if (block.type === "tool_use") {
            parts.push({
              functionCall: {
                name: block.name,
                args: block.input,
              },
            });
          }
        }
      }
      contents.push({ role: "model", parts });
      continue;
    }

    const text =
      typeof msg.content === "string"
        ? msg.content
        : msg.content.map((b) => ("text" in b ? b.text : "")).join("");
    contents.push({ role: "user", parts: [{ text }] });
  }

  return { systemInstruction, contents };
}

import type { LLMProvider } from "../provider";
import type { UnifiedMessage } from "../types";

import { GoogleGenAI } from "@google/genai";
import type {
  Content,
  FunctionCall,
  FunctionDeclaration,
  Part,
} from "@google/genai";

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

  async *streamResponse(
    params: Parameters<LLMProvider["streamResponse"]>[0],
  ): ReturnType<LLMProvider["streamResponse"]> {
    const client = new GoogleGenAI({ apiKey: params.apiKey });
    const model = params.model ?? this.defaultModel;
    const { systemInstruction, contents } = toGeminiContents(params.messages);

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
      },
    });

    let aggregatedFunctionCalls: Array<{
      name: string;
      args: Record<string, unknown>;
    }> = [];

    for await (const chunk of stream) {
      if (chunk.text) {
        yield { type: "text", delta: chunk.text };
      }
      if (chunk.functionCalls) {
        aggregatedFunctionCalls = chunk.functionCalls.map(
          (fc: FunctionCall) => ({
            name: fc.name ?? "",
            args: (fc.args ?? {}) as Record<string, unknown>,
          }),
        );
      }
    }

    for (const fc of aggregatedFunctionCalls) {
      yield {
        type: "tool_use",
        toolCall: {
          id: fc.name,
          name: fc.name,
          input: fc.args,
        },
      };
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

function toGeminiContents(messages: UnifiedMessage[]): {
  systemInstruction: string | undefined;
  contents: Content[];
} {
  let systemInstruction: string | undefined;
  const contents: Content[] = [];

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
              name: toolCallId,
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

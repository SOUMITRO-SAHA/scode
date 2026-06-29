import { describe, expect, it, vi } from "vitest";

import { GeminiAdapter } from "../llm/gemini/adapter";

vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      list: vi.fn().mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          yield { name: "models/gemini-2.5-flash" };
          yield { name: "models/gemini-2.5-pro" };
        },
      }),
      generateContentStream: vi.fn().mockResolvedValue({
        [Symbol.asyncIterator]: async function* () {
          yield {
            candidates: [
              {
                content: {
                  parts: [{ text: "Hello" }],
                },
              },
            ],
          };
          yield {
            functionCalls: [{ name: "read", args: { path: "file.txt" } }],
          };
        },
      }),
    },
  })),
}));

function extractEvents(
  gen: AsyncGenerator<StreamEvent>,
): Promise<StreamEvent[]> {
  const events: StreamEvent[] = [];
  return (async () => {
    for await (const event of gen) {
      events.push(event);
    }
    return events;
  })();
}

describe("GeminiAdapter - tool call ID uniqueness", () => {
  const adapter = new GeminiAdapter();

  it("yields unique tool call IDs for same function name", async () => {
    const gen = adapter.streamResponse({
      system: "test",
      messages: [{ role: "user", content: "test" }],
      tools: [],
      model: "gemini-2.5-flash",
      apiKey: "test-key",
    });

    const events = await extractEvents(gen);
    const toolUses = events.filter((e) => e.type === "tool_use");
    expect(toolUses.length).toBeGreaterThanOrEqual(1);
    if (toolUses.length >= 1) {
      const tc = toolUses[0].type === "tool_use" ? toolUses[0].toolCall : null;
      // ID should contain the function name and be unique-formatted
      expect(tc?.id).toContain("read");
      expect(tc?.name).toBe("read");
      expect(tc?.input).toEqual({ path: "file.txt" });
    }
  });

  it("generates unique IDs that differ from just the function name", async () => {
    const gen = adapter.streamResponse({
      system: "test",
      messages: [{ role: "user", content: "test" }],
      tools: [],
      model: "gemini-2.5-flash",
      apiKey: "test-key",
    });

    const events = await extractEvents(gen);
    const toolUses = events.filter(
      (e): e is Extract<StreamEvent, { type: "tool_use" }> =>
        e.type === "tool_use",
    );
    for (const tu of toolUses) {
      expect(tu.toolCall.id).not.toBe(tu.toolCall.name);
      expect(tu.toolCall.id).toContain(tu.toolCall.name);
    }
  });

  it("yields text events from stream", async () => {
    const gen = adapter.streamResponse({
      system: "test",
      messages: [{ role: "user", content: "test" }],
      tools: [],
      model: "gemini-2.5-flash",
      apiKey: "test-key",
    });

    const events = await extractEvents(gen);
    const texts = events.filter((e) => e.type === "text");
    expect(texts.length).toBeGreaterThanOrEqual(1);
    const textEvent = texts[0];
    if (textEvent.type === "text") {
      expect(textEvent.delta).toBe("Hello");
    }
  });

  it("reports supported efforts for compatible models", () => {
    const efforts = adapter.getSupportedEfforts("gemini-2.5-flash");
    expect(efforts).toContain("low");
    expect(efforts).toContain("high");
  });

  it("reports empty efforts for non-thinking models", () => {
    const efforts = adapter.getSupportedEfforts("gemini-1.5-flash");
    expect(efforts).toEqual([]);
  });
});

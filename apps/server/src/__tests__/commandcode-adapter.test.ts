import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CommandCodeAdapter } from "../llm/commandcode/adapter";
import type { StreamEvent } from "../types";

function mockSSEStream(lines: string[]): ReadableStream {
  const encoder = new TextEncoder();
  const chunks = lines.map((l) => encoder.encode(l + "\n"));
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
  });
}

async function collectEvents(
  gen: AsyncGenerator<StreamEvent>,
): Promise<StreamEvent[]> {
  const events: StreamEvent[] = [];
  for await (const e of gen) events.push(e);
  return events;
}

describe("CommandCodeAdapter - SSE parsing", () => {
  const adapter = new CommandCodeAdapter();
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("parses data: with space (standard SSE)", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      body: mockSSEStream([
        'data: {"choices":[{"delta":{"content":"Hello"}}]}',
        "data: [DONE]",
      ]),
    } as Response);

    const gen = adapter.streamResponse({
      system: "",
      messages: [{ role: "user", content: "hi" }],
      tools: [],
      apiKey: "test",
    });

    const events = await collectEvents(gen);
    const textEvents = events.filter((e) => e.type === "text");
    expect(textEvents).toHaveLength(1);
    if (textEvents[0].type === "text") {
      expect(textEvents[0].delta).toBe("Hello");
    }
  });

  it("parses data: without space (compact SSE)", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      body: mockSSEStream([
        'data:{"choices":[{"delta":{"content":"World"}}]}',
        "data:[DONE]",
      ]),
    } as Response);

    const gen = adapter.streamResponse({
      system: "",
      messages: [{ role: "user", content: "hi" }],
      tools: [],
      apiKey: "test",
    });

    const events = await collectEvents(gen);
    const textEvents = events.filter((e) => e.type === "text");
    expect(textEvents).toHaveLength(1);
    if (textEvents[0].type === "text") {
      expect(textEvents[0].delta).toBe("World");
    }
  });

  it("handles tool calls from SSE stream", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      body: mockSSEStream([
        'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"call_1","function":{"name":"read","arguments":"{\\"path\\":\\"file.txt\\"}"}}]}}]}',
        'data: {"choices":[{"delta":{},"finish_reason":"tool_calls"}]}',
        "data: [DONE]",
      ]),
    } as Response);

    const gen = adapter.streamResponse({
      system: "",
      messages: [{ role: "user", content: "read file" }],
      tools: [
        {
          name: "read",
          description: "Read files",
          inputSchema: { type: "object", properties: {}, required: [] },
        },
      ],
      apiKey: "test",
    });

    const events = await collectEvents(gen);
    const toolUses = events.filter((e) => e.type === "tool_use");
    expect(toolUses).toHaveLength(1);
    if (toolUses[0].type === "tool_use") {
      expect(toolUses[0].toolCall.name).toBe("read");
      expect(toolUses[0].toolCall.input).toEqual({ path: "file.txt" });
    }
  });

  it("skips non-data lines gracefully", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      body: mockSSEStream([
        ": comment",
        "",
        'data: {"choices":[{"delta":{"content":"ok"}}]}',
        "data: [DONE]",
      ]),
    } as Response);

    const gen = adapter.streamResponse({
      system: "",
      messages: [{ role: "user", content: "hi" }],
      tools: [],
      apiKey: "test",
    });

    const events = await collectEvents(gen);
    const textEvents = events.filter((e) => e.type === "text");
    expect(textEvents).toHaveLength(1);
  });

  it("handles multi-line JSON chunks split across buffers", async () => {
    const encoder = new TextEncoder();
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"con'));
        controller.enqueue(encoder.encode('tent":"partial"}}]}'));
        controller.enqueue(encoder.encode("\n"));
        controller.enqueue(encoder.encode("data: [DONE]\n"));
        controller.close();
      },
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      body,
    } as Response);

    const gen = adapter.streamResponse({
      system: "",
      messages: [{ role: "user", content: "hi" }],
      tools: [],
      apiKey: "test",
    });

    const events = await collectEvents(gen);
    const textEvents = events.filter((e) => e.type === "text");
    expect(textEvents).toHaveLength(1);
    if (textEvents[0].type === "text") {
      expect(textEvents[0].delta).toBe("partial");
    }
  });

  it("returns default model on API error", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve("Unauthorized"),
    } as Response);

    await expect(
      adapter
        .streamResponse({
          system: "",
          messages: [{ role: "user", content: "hi" }],
          tools: [],
          apiKey: "bad-key",
        })
        .next(),
    ).rejects.toThrow("CommandCode API error");
  });
});

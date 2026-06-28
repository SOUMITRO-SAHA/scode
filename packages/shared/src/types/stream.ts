import type { ToolCall } from "./entities";

export type StreamEvent =
  | { type: "text"; delta: string }
  | { type: "thought"; text: string }
  | { type: "tool_use"; toolCall: ToolCall }
  | { type: "error"; message: string }
  | { type: "done" };

export type StreamChunk =
  | { type: "text"; delta: string }
  | { type: "thought"; text: string }
  | { type: "error"; message: string }
  | { type: "meta"; sessionId: string; model?: string }
  | { type: "tool_use"; toolCall: ToolCall }
  | {
      type: "tool_result";
      toolUseId: string;
      name: string;
      result: string;
      isError?: boolean;
    };

export function encodeStreamChunk(chunk: StreamChunk): string {
  return JSON.stringify(chunk) + "\n";
}

export function decodeStreamChunk(line: string): StreamChunk | null {
  try {
    return JSON.parse(line) as StreamChunk;
  } catch {
    return null;
  }
}

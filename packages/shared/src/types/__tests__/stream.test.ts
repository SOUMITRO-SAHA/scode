import { describe, expect, it } from "vitest";

import { decodeStreamChunk, encodeStreamChunk } from "../stream";

describe("encodeStreamChunk", () => {
  it("encodes a text chunk as JSON line", () => {
    const line = encodeStreamChunk({ type: "text", delta: "Hello" });
    expect(line).toBe('{"type":"text","delta":"Hello"}\n');
  });

  it("encodes an error chunk", () => {
    const line = encodeStreamChunk({ type: "error", message: "fail" });
    expect(JSON.parse(line.trim())).toEqual({
      type: "error",
      message: "fail",
    });
  });

  it("encodes a meta chunk", () => {
    const line = encodeStreamChunk({
      type: "meta",
      sessionId: "s1",
      model: "claude",
    });
    expect(JSON.parse(line.trim())).toEqual({
      type: "meta",
      sessionId: "s1",
      model: "claude",
    });
  });
});

describe("decodeStreamChunk", () => {
  it("decodes valid JSON line", () => {
    const chunk = decodeStreamChunk(
      JSON.stringify({ type: "text", delta: "Hi" }),
    );
    expect(chunk).toEqual({ type: "text", delta: "Hi" });
  });

  it("returns null for invalid JSON", () => {
    expect(decodeStreamChunk("not-json")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(decodeStreamChunk("")).toBeNull();
  });
});

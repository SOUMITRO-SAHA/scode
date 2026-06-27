import { describe, expect, it } from "vitest";

import { Effect } from "effect";

import { serializeContent, splitLines, truncate } from "../string";

describe("truncate", () => {
  it("returns string as-is when under limit", () => {
    expect(Effect.runSync(truncate("hello", 10))).toBe("hello");
  });

  it("returns string as-is when exactly at limit", () => {
    expect(Effect.runSync(truncate("hello", 5))).toBe("hello");
  });

  it("truncates when over limit", () => {
    expect(Effect.runSync(truncate("hello world", 5))).toBe("hello");
  });

  it("handles empty string", () => {
    expect(Effect.runSync(truncate("", 5))).toBe("");
  });

  it("handles zero limit", () => {
    expect(Effect.runSync(truncate("hello", 0))).toBe("");
  });
});

describe("splitLines", () => {
  it("splits text by newline", () => {
    expect(Effect.runSync(splitLines("a\nb\nc"))).toEqual(["a", "b", "c"]);
  });

  it("filters empty lines", () => {
    expect(Effect.runSync(splitLines("a\n\nb"))).toEqual(["a", "b"]);
  });

  it("handles single line", () => {
    expect(Effect.runSync(splitLines("hello"))).toEqual(["hello"]);
  });

  it("handles empty string", () => {
    expect(Effect.runSync(splitLines(""))).toEqual([]);
  });

  it("handles trailing newline", () => {
    expect(Effect.runSync(splitLines("a\nb\n"))).toEqual(["a", "b"]);
  });
});

describe("serializeContent", () => {
  it("returns string content as-is", () => {
    expect(Effect.runSync(serializeContent("hello"))).toBe("hello");
  });

  it("stringifies object content", () => {
    expect(Effect.runSync(serializeContent({ text: "hello" }))).toBe(
      '{"text":"hello"}',
    );
  });

  it("stringifies array content", () => {
    expect(
      Effect.runSync(serializeContent([{ type: "text", text: "hi" }])),
    ).toBe('[{"type":"text","text":"hi"}]');
  });

  it("handles empty string", () => {
    expect(Effect.runSync(serializeContent(""))).toBe("");
  });
});

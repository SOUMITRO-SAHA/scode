import { describe, expect, it } from "vitest";

import { Effect } from "effect";

import { formatModelName, parseModelString } from "../model";

describe("parseModelString", () => {
  it("parses provider/model format", () => {
    const result = Effect.runSync(
      parseModelString("anthropic/claude-sonnet-4-20250515"),
    );
    expect(result).toEqual({
      providerId: "anthropic",
      model: "claude-sonnet-4-20250515",
    });
  });

  it("returns error for missing slash", () => {
    const result = Effect.runSync(
      Effect.flip(parseModelString("claude-sonnet-4")),
    );
    expect(result._tag).toBe("ModelParseError");
  });

  it("returns error for empty parts", () => {
    const err1 = Effect.runSync(Effect.flip(parseModelString("/model")));
    expect(err1._tag).toBe("ModelParseError");
    const err2 = Effect.runSync(Effect.flip(parseModelString("provider/")));
    expect(err2._tag).toBe("ModelParseError");
  });
});

describe("formatModelName", () => {
  it("formats claude model name", () => {
    const result = Effect.runSync(formatModelName("claude-sonnet-4-20250515"));
    expect(result).toBe("Sonnet 4");
  });

  it("handles non-claude models", () => {
    const result = Effect.runSync(formatModelName("deepseek-chat"));
    expect(result).toBe("Deepseek Chat");
  });

  it("handles empty string", () => {
    const result = Effect.runSync(formatModelName(""));
    expect(result).toBe("");
  });
});

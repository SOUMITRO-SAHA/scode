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

  it("returns empty provider for bare model name", () => {
    const result = Effect.runSync(parseModelString("claude-sonnet-4"));
    expect(result).toEqual({
      providerId: "",
      model: "claude-sonnet-4",
    });
  });

  it("returns empty provider for /model format", () => {
    const result = Effect.runSync(parseModelString("/model"));
    expect(result).toEqual({
      providerId: "",
      model: "model",
    });
  });

  it("returns error for provider/ with empty model", () => {
    const err = Effect.runSync(Effect.flip(parseModelString("provider/")));
    expect(err._tag).toBe("ModelParseError");
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

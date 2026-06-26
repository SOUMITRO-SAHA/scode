import { describe, expect, it } from "vitest";

import { formatModelName, parseModelString } from "../model";

describe("parseModelString", () => {
  it("parses provider/model format", () => {
    expect(parseModelString("anthropic/claude-sonnet-4-20250515")).toEqual({
      providerId: "anthropic",
      model: "claude-sonnet-4-20250515",
    });
  });

  it("returns null for missing slash", () => {
    expect(parseModelString("claude-sonnet-4")).toBeNull();
  });

  it("returns null for empty parts", () => {
    expect(parseModelString("/model")).toBeNull();
    expect(parseModelString("provider/")).toBeNull();
  });
});

describe("formatModelName", () => {
  it("formats claude model name", () => {
    expect(formatModelName("claude-sonnet-4-20250515")).toBe("Sonnet 4");
  });

  it("handles non-claude models", () => {
    expect(formatModelName("deepseek-chat")).toBe("Deepseek Chat");
  });

  it("handles empty string", () => {
    expect(formatModelName("")).toBe("");
  });
});

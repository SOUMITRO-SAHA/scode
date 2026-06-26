import { describe, expect, it } from "vitest";

import { DEFAULT_APP_CONFIG, DEFAULT_MODEL_STRING } from "../defaults";

describe("defaults", () => {
  it("DEFAULT_MODEL_STRING", () => {
    expect(DEFAULT_MODEL_STRING).toBe("claude/claude-sonnet-4-20250515");
  });

  it("DEFAULT_APP_CONFIG has correct shape", () => {
    expect(DEFAULT_APP_CONFIG).toEqual({
      theme: "dark",
      defaultProvider: "claude",
      defaultModel: "claude-sonnet-4-20250515",
      maxTokens: 8192,
    });
  });
});

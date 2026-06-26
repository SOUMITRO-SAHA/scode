import { describe, expect, it } from "vitest";

import { PROVIDER_ENV_MAP } from "../providers";

describe("PROVIDER_ENV_MAP", () => {
  it("maps claude to ANTHROPIC_API_KEY", () => {
    expect(PROVIDER_ENV_MAP.claude).toBe("ANTHROPIC_API_KEY");
  });

  it("maps all known providers", () => {
    expect(PROVIDER_ENV_MAP).toEqual({
      claude: "ANTHROPIC_API_KEY",
      gemini: "GEMINI_API_KEY",
      deepseek: "DEEPSEEK_API_KEY",
      zai: "ZHIPU_API_KEY",
      minimax: "MINIMAX_API_KEY",
      cohere: "COHERE_API_KEY",
    });
  });
});

import { describe, expect, it } from "vitest";

import { matchSkills } from "../skill/matcher";
import type { Skill } from "../types";

const testSkills: Skill[] = [
  {
    name: "greeting",
    description: "Greet users when they say hello",
    body: "When the user says hello, greet them warmly.",
  },
  {
    name: "weather",
    description: "Check the weather for a location",
    body: "Use the weather API to get current conditions.",
  },
];

describe("matchSkills", () => {
  it("returns MAIN_SKILL when no skills provided", () => {
    const result = matchSkills("hello", []);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("main");
  });

  it("matches greeting skill for hello prompt", () => {
    const result = matchSkills("hello", testSkills);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.map((s) => s.name)).toContain("greeting");
  });

  it("always includes main skill at the end", () => {
    const result = matchSkills("hello", testSkills);
    expect(result[result.length - 1].name).toBe("main");
  });

  it("returns only MAIN_SKILL when no skills match", () => {
    const result = matchSkills("quantum physics", testSkills);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("main");
  });

  it("matches multiple skills and orders by score", () => {
    const manySkills: Skill[] = [
      {
        name: "weather",
        description: "Check weather conditions",
        body: "Use the weather API to get current weather conditions.",
      },
      {
        name: "welcome",
        description: "Greet users when they say hello or welcome",
        body: "When the user says hello or welcome, respond warmly.",
      },
    ];
    const result = matchSkills("weather conditions today", manySkills);
    expect(result[0].name).toBe("weather");
    expect(result[result.length - 1].name).toBe("main");
  });

  it("filters out stop words", () => {
    const result = matchSkills("the a an is", testSkills);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("main");
  });

  it("handles short tokens (<=2 chars)", () => {
    const result = matchSkills("hi ok go", testSkills);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("main");
  });
});

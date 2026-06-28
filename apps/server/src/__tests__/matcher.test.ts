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

  it("matches hyphenated skill names by component parts", () => {
    const skills: Skill[] = [
      {
        name: "welcome-me",
        description: "Greet new users",
        body: "Greet users warmly.",
      },
    ];
    const result = matchSkills("use welcome skill to guide me", skills);
    expect(result.map((s) => s.name)).toContain("welcome-me");
  });

  it("matches hyphenated description tokens", () => {
    const skills: Skill[] = [
      {
        name: "client-server",
        description: "Build client-server architecture",
        body: "Architecture guidance.",
      },
    ];
    const result = matchSkills("help me with client architecture", skills);
    expect(result.map((s) => s.name)).toContain("client-server");
  });

  it("fuzzy matches when exact token not found but substring exists", () => {
    const skills: Skill[] = [
      {
        name: "welcome-me",
        description: "Greet new users and explain architecture",
        body: "",
      },
    ];
    const result = matchSkills("use welcome skill please", skills);
    expect(result.map((s) => s.name)).toContain("welcome-me");
  });

  it("matches skill name in 'load X skill' query", () => {
    const skills: Skill[] = [
      {
        name: "welcome-me",
        description: "Greet new users",
        body: "",
      },
      {
        name: "documentation",
        description: "Generate project docs",
        body: "",
      },
    ];
    const result = matchSkills("load welcome skill", skills);
    expect(result.map((s) => s.name)).toContain("welcome-me");
  });

  it("returns MAIN_SKILL for irrelevant prompts even with fuzzy", () => {
    const skills: Skill[] = [
      {
        name: "welcome-me",
        description: "Greet new users",
        body: "",
      },
    ];
    const result = matchSkills("quantum physics computation", skills);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("main");
  });

  it("prefers exact match over fuzzy match", () => {
    const skills: Skill[] = [
      {
        name: "weather",
        description: "Check weather conditions",
        body: "",
      },
      {
        name: "welcome-me",
        description: "Greet new users warmly",
        body: "",
      },
    ];
    const result = matchSkills("weather", skills);
    expect(result[0].name).toBe("weather");
  });

  it("matches partial prompt like 'greet' to welcome-me description", () => {
    const skills: Skill[] = [
      {
        name: "welcome-me",
        description: "Greet new users and explain architecture",
        body: "",
      },
    ];
    const result = matchSkills("greet me", skills);
    expect(result.map((s) => s.name)).toContain("welcome-me");
  });

  it("matches 'welcome' prompt to welcome-me via fuzzy", () => {
    const skills: Skill[] = [
      {
        name: "welcome-me",
        description: "Greet new users and explain scode architecture",
        body: "",
      },
    ];
    const result = matchSkills("welcome", skills);
    expect(result.map((s) => s.name)).toContain("welcome-me");
  });

  it("matches changelog skill for 'changelog' prompt", () => {
    const skills: Skill[] = [
      {
        name: "changelog",
        description: "Generate changelog from git history",
        body: "",
      },
    ];
    const result = matchSkills("generate changelog", skills);
    expect(result.map((s) => s.name)).toContain("changelog");
  });

  it("matches documentation skill for 'docs' prompt", () => {
    const skills: Skill[] = [
      {
        name: "documentation",
        description: "Generate or update project documentation",
        body: "",
      },
    ];
    const result = matchSkills("update project documentation", skills);
    expect(result.map((s) => s.name)).toContain("documentation");
  });
});

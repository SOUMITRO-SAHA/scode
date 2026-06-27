import { describe, expect, it } from "vitest";

import { buildPrompt } from "../prompt/builder";
import type { Skill, ToolDefinition } from "../types";

const skills: Skill[] = [
  {
    name: "test",
    description: "A test skill",
    body: "Test body content.",
  },
];

const tools: ToolDefinition[] = [
  {
    name: "read",
    description: "Read files",
    inputSchema: { type: "object", properties: {} },
  },
];

describe("buildPrompt", () => {
  it("builds system prompt with skill list and tools", () => {
    const result = buildPrompt(skills, "hello", tools);
    expect(result.system).toContain("You are scode");
    expect(result.system).toContain("<available_skills>");
    expect(result.system).toContain("<name>test</name>");
    expect(result.system).toContain("## Available Tools");
    expect(result.system).toContain("`skill`");
  });

  it("includes user message", () => {
    const result = buildPrompt(skills, "hello", tools);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0]).toEqual({ role: "user", content: "hello" });
  });

  it("handles empty skills", () => {
    const result = buildPrompt([], "hello", tools);
    expect(result.system).not.toContain("<available_skills>");
  });

  it("handles empty tools", () => {
    const result = buildPrompt(skills, "hello", []);
    expect(result.system).toContain("(none)");
  });
});

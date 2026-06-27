import type { UnifiedMessage } from "../llm/types";
import type { Skill, ToolDefinition } from "../types";

function renderSkillList(skills: Skill[]): string {
  if (skills.length === 0) return "";
  return skills
    .map(
      (s) =>
        `  <skill>\n    <name>${s.name}</name>\n    <description>${s.description}</description>\n  </skill>`,
    )
    .join("\n");
}

export function buildPrompt(
  skills: Skill[],
  userPrompt: string,
  tools: ToolDefinition[],
): { system: string; messages: UnifiedMessage[] } {
  const skillList =
    skills.length > 0
      ? `<available_skills>\n${renderSkillList(skills)}\n</available_skills>`
      : "";

  const toolDescs = tools
    .map((t) => `- \`${t.name}\`: ${t.description}`)
    .join("\n");

  const system = [
    "You are scode, an AI coding agent. You help users with software engineering tasks.",
    "",
    skillList,
    "",
    "## Available Tools",
    toolDescs || "(none)",
    "",
    [
      "Use tools when needed to accomplish the task.",
      "Use the `skill` tool to load a skill's full instructions when a task matches its description.",
      "Always ask for clarification if the request is ambiguous.",
      "Be concise, direct, and professional. Do not add commentary beyond what's needed.",
    ].join(" "),
  ].join("\n");

  return {
    system,
    messages: [{ role: "user", content: userPrompt }],
  };
}

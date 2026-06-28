import type { UnifiedMessage } from "../llm/types";
import type { Skill, ToolDefinition } from "../types";

const MAIN_SKILL_NAME = "main";

function renderSkillList(skills: Skill[]): string {
  const real = skills.filter((s) => s.name !== MAIN_SKILL_NAME);
  if (real.length === 0) return "";
  return real
    .map(
      (s) =>
        `  <skill>\n    <name>${s.name}</name>\n    <description>${s.description}</description>\n  </skill>`,
    )
    .join("\n");
}

function extractMainPreamble(skills: Skill[]): string {
  const main = skills.find((s) => s.name === MAIN_SKILL_NAME);
  return (
    main?.body?.trim() ||
    "You are scode, an AI coding agent. You help users with software engineering tasks."
  );
}

export function buildPrompt(
  skills: Skill[],
  userPrompt: string,
  tools: ToolDefinition[],
): { system: string; messages: UnifiedMessage[] } {
  const rendered = renderSkillList(skills);
  const skillList = rendered
    ? `<available_skills>\n${rendered}\n</available_skills>`
    : "";

  const toolDescs = tools
    .map((t) => `- \`${t.name}\`: ${t.description}`)
    .join("\n");

  const system = [
    extractMainPreamble(skills),
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

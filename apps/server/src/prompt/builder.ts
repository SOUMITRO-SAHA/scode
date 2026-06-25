import type { Skill, ToolDefinition } from "../types"
import type { UnifiedMessage } from "../llm/types"

export function buildPrompt(
  skills: Skill[],
  userPrompt: string,
  tools: ToolDefinition[],
): { system: string; messages: UnifiedMessage[] } {
  const skillSections = skills
    .map((s) => `## ${s.name}\n${s.description}\n\n${s.body}`)
    .join("\n\n---\n\n")

  const toolDescs = tools
    .map((t) => `- \`${t.name}\`: ${t.description}`)
    .join("\n")

  const system = [
    "You are scode, an AI coding agent. You help users with software engineering tasks.",
    "",
    "## Available Skills",
    skillSections || "(none matched)",
    "",
    "## Available Tools",
    toolDescs || "(none)",
    "",
    "Use tools when needed to accomplish the task. Always ask for clarification if the request is ambiguous.",
    "Be concise, direct, and professional. Do not add commentary beyond what's needed.",
  ].join("\n")

  return {
    system,
    messages: [{ role: "user", content: userPrompt }],
  }
}

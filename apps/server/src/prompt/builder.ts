import type { Skill, ToolDefinition } from "../types.js"
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages/messages.js"

export function buildPrompt(
  skills: Skill[],
  userPrompt: string,
  tools: ToolDefinition[],
): { system: string; messages: MessageParam[] } {
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
    messages: [{ role: "user" as const, content: userPrompt }],
  }
}

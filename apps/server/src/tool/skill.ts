import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import type { ToolDefinition, ToolHandler } from "../types";

const WORKSPACE = process.cwd();
const SKILLS_GLOB = ".agents/skills";

export const definition: ToolDefinition = {
  name: "skill",
  description:
    "Load a specialized skill by name. Use this to inject skill instructions and resources into the conversation when a task matches a skill's description.",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description:
          "Name of the skill to load (from the available skills list)",
      },
    },
    required: ["name"],
  },
};

export const handler: ToolHandler = async (input: Record<string, unknown>) => {
  const name = input.name as string;
  if (!name) return { error: "Skill name required" };

  const skillDir = resolve(WORKSPACE, SKILLS_GLOB, name);
  const skillPath = join(skillDir, "SKILL.md");

  try {
    statSync(skillPath);
  } catch {
    return { error: `Skill "${name}" not found` };
  }

  const content = readFileSync(skillPath, "utf-8");

  let files: string[] = [];
  try {
    files = readdirSync(skillDir)
      .filter((f) => f !== "SKILL.md")
      .map((f) => join(skillDir, f));
  } catch {
    /* no extra files */
  }

  const fileList =
    files.length > 0
      ? `<skill_files>\n${files.map((f) => `<file>${f}</file>`).join("\n")}\n</skill_files>`
      : "";

  return {
    name,
    directory: skillDir,
    output: `<skill_content name="${name}">\n${content}\n\nBase directory: ${skillDir}\n${fileList}\n</skill_content>`,
  };
};

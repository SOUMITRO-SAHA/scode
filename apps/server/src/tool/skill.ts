import { Effect } from "effect";
import { readdirSync } from "node:fs";
import { join } from "node:path";

import { discover } from "../skill/discover";
import { loadSkill } from "../skill/loader";
import type { ToolDefinition, ToolHandler } from "../types";

import { DebugLogger } from "@scode/shared/logger";

const dbg = new DebugLogger("server:tool:skill");

const NOT_FOUND = "Skill name required";

function baseDefinition(): ToolDefinition {
  return {
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
}

export const definition: ToolDefinition = baseDefinition();

export function constrainedDefinition(skillNames: string[]): ToolDefinition {
  return {
    ...baseDefinition(),
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the skill to load",
          enum: skillNames,
        },
      },
      required: ["name"],
    },
  };
}

function findSkill(name: string) {
  return Effect.gen(function* () {
    const dirs = yield* discover();
    const available = dirs.map((d) => d.name);

    dbg.log("skill tool called", { name, available });

    const dir = dirs.find((d) => d.name === name);
    if (!dir) {
      const fuzzy = dirs.filter(
        (d) => d.name.includes(name) || name.includes(d.name),
      );
      const hint =
        fuzzy.length > 0
          ? ` Did you mean: ${fuzzy.map((d) => d.name).join(", ")}?`
          : "";
      const msg =
        available.length > 0
          ? `Skill "${name}" not found. Available skills: ${available.join(", ")}.${hint}`
          : `Skill "${name}" not found. No skills are currently loaded.`;
      dbg.warn("skill not found", { requested: name, available, fuzzy });
      return { error: msg };
    }

    const skill = yield* loadSkill(dir);
    if (!skill) {
      dbg.error("skill failed to parse", { name, path: dir.path });
      return { error: `Skill "${name}" failed to parse` };
    }

    let extraFiles: string[] = [];
    try {
      extraFiles = readdirSync(dir.path)
        .filter((f) => f !== "SKILL.md")
        .map((f) => join(dir.path, f));
    } catch {
      /* no extra files */
    }

    dbg.log("skill loaded", {
      name,
      bodyLength: skill.body.length,
      extraFiles: extraFiles.length,
    });

    const fileList =
      extraFiles.length > 0
        ? `<skill_files>\n${extraFiles.map((f) => `<file>${f}</file>`).join("\n")}\n</skill_files>`
        : "";

    return {
      name,
      directory: dir.path,
      output: `<skill_content name="${name}">\n${skill.body}\n\nBase directory: ${dir.path}\n${fileList}\n</skill_content>`,
    };
  });
}

export const handler: ToolHandler = async (input: Record<string, unknown>) => {
  const name = input.name as string;
  if (!name) return { error: NOT_FOUND };

  try {
    return await Effect.runPromise(findSkill(name));
  } catch (err) {
    dbg.error("skill tool error", { name, error: String(err) });
    return { error: `Skill tool error: ${String(err)}` };
  }
};

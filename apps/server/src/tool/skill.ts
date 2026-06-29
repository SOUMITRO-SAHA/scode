import { Effect, Schema } from "effect";
import { readdirSync } from "node:fs";
import { join } from "node:path";

import { discover } from "../skill/discover";
import { loadSkill } from "../skill/loader";
import type { ToolDefinition } from "../types";
import { Tool } from "./core";

import { ToolFailure } from "@scode/shared/effect";

const InputStruct = Schema.Struct({
  name: Schema.String,
});

export const tool = Tool.make({
  name: "skill",
  description:
    "Load a specialized skill by name. Use this to inject skill instructions and resources into the conversation when a task matches a skill's description.",
  input: InputStruct,
  output: Schema.Struct({
    name: Schema.optional(Schema.String),
    directory: Schema.optional(Schema.String),
    output: Schema.optional(Schema.String),
    error: Schema.optional(Schema.String),
  }),
  execute: ({ name }) => {
    if (!name) {
      return Effect.succeed({ error: "Skill name required" });
    }

    return Effect.gen(function* () {
      const dirs = yield* Effect.tryPromise({
        try: () => Effect.runPromise(discover()),
        catch: (e) =>
          new ToolFailure({ error: `Skill discovery failed: ${String(e)}` }),
      });

      const dir = dirs.find((d: { name: string }) => d.name === name);
      if (!dir) {
        const available = dirs.map((d: { name: string }) => d.name);
        const fuzzy = dirs.filter(
          (d: { name: string }) =>
            d.name.includes(name) || name.includes(d.name),
        );
        const hint =
          fuzzy.length > 0
            ? ` Did you mean: ${fuzzy.map((d: { name: string }) => d.name).join(", ")}?`
            : "";
        const msg =
          available.length > 0
            ? `Skill "${name}" not found. Available skills: ${available.join(", ")}.${hint}`
            : `Skill "${name}" not found. No skills are currently loaded.`;
        return { error: msg };
      }

      const skill = yield* Effect.tryPromise({
        try: () => Effect.runPromise(loadSkill(dir)),
        catch: (e) =>
          new ToolFailure({ error: `Skill load failed: ${String(e)}` }),
      });
      if (!skill) {
        return { error: `Skill "${name}" failed to parse` };
      }

      let extraFiles: string[] = [];
      try {
        extraFiles = readdirSync(dir.path)
          .filter((f: string) => f !== "SKILL.md")
          .map((f: string) => join(dir.path, f));
      } catch {
        /* no extra files */
      }

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
  },
});

export function constrainedDefinition(skillNames: string[]): ToolDefinition {
  return {
    name: "skill",
    description:
      "Load a specialized skill by name. Use this to inject skill instructions and resources into the conversation when a task matches a skill's description.",
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

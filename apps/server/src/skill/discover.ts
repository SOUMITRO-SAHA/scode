import { Effect } from "effect";
import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { SkillDiscoverError } from "./error";

const SKILL_DIRS = [
  // Cross-client standard
  { subdir: ".agents/skills" },
  // Client-specific
  { subdir: ".opencode/skills" },
  { subdir: ".claude/skills" },
  { subdir: ".codex/skills" },
  { subdir: ".cursor/skills" },
  { subdir: ".gemini/skills" },
  { subdir: ".kilocode/skills" },
  { subdir: ".commandcode/skills" },
];

export interface SkillDir {
  name: string;
  path: string;
}

function scanDir(
  base: string,
  subdir: string,
  label: string,
): Effect.Effect<SkillDir[], SkillDiscoverError> {
  const target = join(base, subdir);
  return Effect.try({
    try: () => {
      if (!existsSync(target)) return [];
      return readdirSync(target, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => ({ name: e.name, path: join(target, e.name) }));
    },
    catch: (err) =>
      new SkillDiscoverError({ dir: target, message: String(err) }),
  });
}

export function discover(): Effect.Effect<SkillDir[], SkillDiscoverError> {
  const scans: Effect.Effect<SkillDir[], SkillDiscoverError>[] = [];

  // Project-level (higher precedence)
  for (const { subdir } of SKILL_DIRS) {
    scans.push(scanDir(process.cwd(), subdir, "project"));
  }

  // User-level — skip Cursor (no global location per the table)
  for (const { subdir } of SKILL_DIRS) {
    if (subdir === ".cursor/skills") continue;
    scans.push(scanDir(homedir(), subdir, "user"));
  }

  return Effect.all(scans).pipe(
    Effect.map((results) => {
      const seen = new Set<string>();
      const merged: SkillDir[] = [];

      for (const dirs of results) {
        for (const d of dirs) {
          if (seen.has(d.name)) {
            continue;
          }
          seen.add(d.name);
          merged.push(d);
        }
      }

      return merged;
    }),
  );
}

import { Effect } from "effect";
import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { SkillDiscoverError } from "./error";

import { Logger } from "@scode/shared/logger";

const logger = new Logger();

const SKILL_DIRS = [
  { subdir: ".agents/skills" },
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

export function discover(
  cwd: string,
): Effect.Effect<SkillDir[], SkillDiscoverError> {
  return Effect.gen(function* () {
    logger.info(`[discover] Starting skill discovery for cwd: ${cwd}`);
    const home = homedir();

    const scans: Effect.Effect<SkillDir[], SkillDiscoverError>[] = [];

    for (const { subdir } of SKILL_DIRS) {
      const target = join(cwd, subdir);
      logger.debug(
        `[discover] Scanning workspace: ${target} (exists: ${existsSync(target)})`,
      );
      scans.push(scanDir(cwd, subdir));
    }

    for (const { subdir } of SKILL_DIRS) {
      if (subdir === ".cursor/skills") continue;
      const target = join(home, subdir);
      logger.debug(
        `[discover] Scanning home: ${target} (exists: ${existsSync(target)})`,
      );
      scans.push(scanDir(home, subdir));
    }

    const results = yield* Effect.all(scans);

    const seen = new Set<string>();
    const merged: SkillDir[] = [];

    for (const dirs of results) {
      for (const d of dirs) {
        if (seen.has(d.name)) continue;
        seen.add(d.name);
        merged.push(d);
      }
    }

    logger.info(
      `[discover] Found ${merged.length} unique skills: ${merged.map((d) => d.name).join(", ")}`,
    );
    return merged;
  });
}

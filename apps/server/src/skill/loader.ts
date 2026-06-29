import { Effect } from "effect";
import { existsSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { parseAllDocuments } from "yaml";

import type { Skill } from "../types";
import type { SkillDir } from "./discover";
import { SkillLoadError } from "./error";

const SKILL_MD = "SKILL.md";
const NAME_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
const NAME_HYPHEN_RE = /--/;
const MAX_NAME_LENGTH = 64;
const MAX_DESC_LENGTH = 1024;
const STRING_FIELDS = new Set([
  "name",
  "description",
  "license",
  "compatibility",
]);

interface Frontmatter {
  name?: string;
  description?: string;
}

function warnNameIssues(name: string, dirName: string): void {
  const issues: string[] = [];
  if (!NAME_RE.test(name)) issues.push("invalid-format");
  if (NAME_HYPHEN_RE.test(name)) issues.push("consecutive-hyphens");
  if (name.length > MAX_NAME_LENGTH) issues.push("exceeds-max-length");
  if (name !== dirName) issues.push("dir-mismatch");
}

function validDescription(desc: string): boolean {
  return desc.length > 0 && desc.length <= MAX_DESC_LENGTH;
}

function parseFrontmatter(raw: string): Frontmatter | null {
  if (!raw.startsWith("---")) return null;
  const endIdx = raw.indexOf("---", 3);
  if (endIdx === -1) return null;
  try {
    const rawYaml = raw.slice(0, endIdx + 3);
    const docs = parseAllDocuments(rawYaml);
    if (docs.length === 0) return null;
    const fm = docs[0].toJS() as Record<string, unknown>;

    // Retry with quoted values when string fields parse as objects
    // (common with unquoted colons in description values)
    if (fm.description && typeof fm.description !== "string") {
      const fixed = rawYaml.replace(
        /^(\s*)(description|name|license|compatibility):\s*(.+)$/gm,
        (_, indent: string, key: string, val: string) => {
          if (val.startsWith('"') || val.startsWith("'"))
            return `${indent}${key}: ${val}`;
          return `${indent}${key}: "${val.replace(/"/g, '\\"')}"`;
        },
      );
      const retry = parseAllDocuments(fixed);
      if (retry.length > 0) {
        const result = retry[0].toJS() as Record<string, unknown>;
        return result as Frontmatter;
      }
    }

    return fm as Frontmatter;
  } catch {
    return null;
  }
}

function readFileContent(
  dir: SkillDir,
): Effect.Effect<string | null, SkillLoadError> {
  const skillPath = join(dir.path, SKILL_MD);
  return Effect.try({
    try: () =>
      existsSync(skillPath) ? readFileSync(skillPath, "utf-8") : null,
    catch: (err) =>
      new SkillLoadError({
        dir: dir.name,
        reason: "parse-error",
        detail: String(err),
      }),
  });
}

function validateSkill(
  fm: Frontmatter | null,
  dir: SkillDir,
): { name: string; description: string } | null {
  if (!fm) return null;
  if (!fm.name) {
    return null;
  }
  warnNameIssues(fm.name, basename(dir.path));
  if (!fm.description || !validDescription(fm.description)) {
    return null;
  }
  return { name: fm.name, description: fm.description };
}

export function loadSkillMeta(
  dir: SkillDir,
): Effect.Effect<{ name: string; description: string } | null, SkillLoadError> {
  return readFileContent(dir).pipe(
    Effect.map((raw) => {
      if (raw === null) return null;
      return validateSkill(parseFrontmatter(raw), dir);
    }),
  );
}

export function loadSkill(
  dir: SkillDir,
): Effect.Effect<Skill | null, SkillLoadError> {
  return readFileContent(dir).pipe(
    Effect.flatMap((raw) => {
      if (raw === null) return Effect.succeed(null);
      const meta = validateSkill(parseFrontmatter(raw), dir);
      if (!meta) return Effect.succeed(null);
      const endIdx = raw.indexOf("---", 3);
      const body = endIdx !== -1 ? raw.slice(endIdx + 3).trim() : "";
      return Effect.succeed({
        name: meta.name,
        description: meta.description,
        body,
      });
    }),
  );
}

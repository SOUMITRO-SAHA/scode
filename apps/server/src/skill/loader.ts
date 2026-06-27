import { existsSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { parseAllDocuments } from "yaml";

import type { Skill } from "../types";
import type { SkillDir } from "./discover";

const SKILL_MD = "SKILL.md";
const NAME_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

interface Frontmatter {
  name?: string;
  description?: string;
}

function validName(name: string, dirName: string): boolean {
  return NAME_RE.test(name) && name === dirName;
}

export function loadSkill(dir: SkillDir): Skill | null {
  const skillPath = join(dir.path, SKILL_MD);
  try {
    if (!existsSync(skillPath)) return null;

    const raw = readFileSync(skillPath, "utf-8");
    if (!raw.startsWith("---")) return null;

    const endIdx = raw.indexOf("---", 3);
    if (endIdx === -1) return null;

    const fmRaw = raw.slice(0, endIdx + 3);
    const body = raw.slice(endIdx + 3).trim();

    const docs = parseAllDocuments(fmRaw);
    if (docs.length === 0) return null;

    const fm = docs[0].toJS() as Frontmatter;
    if (!fm.name) return null;

    const dirName = basename(dir.path);
    if (!validName(fm.name, dirName)) return null;

    return {
      name: fm.name,
      description: fm.description ?? "",
      body,
    };
  } catch {
    return null;
  }
}

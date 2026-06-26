import { readdirSync } from "node:fs";
import { join } from "node:path";

const SKILLS_DIR = join(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
  ".agents",
  "skills",
);

export interface SkillDir {
  name: string;
  path: string;
}

export function discover(): SkillDir[] {
  try {
    const entries = readdirSync(SKILLS_DIR, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory())
      .map((e) => ({ name: e.name, path: join(SKILLS_DIR, e.name) }));
  } catch {
    return [];
  }
}

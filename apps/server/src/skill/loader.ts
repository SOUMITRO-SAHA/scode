import { readFileSync } from "node:fs"
import { join } from "node:path"
import { parseAllDocuments } from "yaml"
import type { Skill } from "../types"
import type { SkillDir } from "./discover"

const SKILL_MD = "SKILL.md"

interface Frontmatter {
  name?: string
  description?: string
}

export function loadSkill(dir: SkillDir): Skill | null {
  const path = join(dir.path, SKILL_MD)
  try {
    const raw = readFileSync(path, "utf-8")

    if (!raw.startsWith("---")) return null

    const endIdx = raw.indexOf("---", 3)
    if (endIdx === -1) return null

    const frontmatterRaw = raw.slice(0, endIdx + 3)
    const body = raw.slice(endIdx + 3).trim()

    const docs = parseAllDocuments(frontmatterRaw)
    if (docs.length === 0) return null

    const fm = docs[0].toJS() as Frontmatter
    if (!fm.name) return null

    return {
      name: fm.name,
      description: fm.description ?? "",
      body,
    }
  } catch {
    return null
  }
}

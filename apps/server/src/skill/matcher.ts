import type { Skill } from "../types.js"

const STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been",
  "i", "me", "my", "we", "our", "you", "your",
  "this", "that", "these", "those",
  "what", "how", "why", "when", "where", "who",
  "do", "does", "did", "can", "will", "would", "could", "should",
  "to", "of", "in", "for", "on", "with", "at", "by", "from",
  "and", "or", "but", "not", "so", "if",
  "please", "help", "like", "want", "need",
])

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t))
}

function keywordOverlap(a: string[], b: string[]): number {
  const setA = new Set(a)
  return b.filter((t) => setA.has(t)).length
}

const MAIN_SKILL: Skill = {
  name: "main",
  description: "General coding assistant for scode project",
  body: `You are scode, a coding agent that helps users with software engineering tasks.
You have access to tools including read, write, edit, bash, grep, and glob.
You can read and write files, search code, edit files with exact string replacement, and run shell commands.
Always ask clarifying questions if the user's request is ambiguous. Be concise and direct.`,
}

export function matchSkills(prompt: string, skills: Skill[]): Skill[] {
  if (skills.length === 0) return [MAIN_SKILL]

  const promptTokens = tokenize(prompt)

  const scored = skills.map((skill) => {
    const skillTokens = tokenize(`${skill.name} ${skill.description} ${skill.body}`)
    return { skill, score: keywordOverlap(promptTokens, skillTokens) }
  })

  const matched = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.skill)

  return matched.length > 0 ? [...matched, MAIN_SKILL] : [MAIN_SKILL]
}

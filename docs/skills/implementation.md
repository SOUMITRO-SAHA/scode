# Skill System Implementation

The skill system follows a **progressive disclosure** architecture:

```
Discovery → Activation → Execution
```

| Stage          | What Happens                                         | Context Cost                     |
| -------------- | ---------------------------------------------------- | -------------------------------- |
| **Discovery**  | Skill name + description loaded into system prompt   | Minimal (a few tokens per skill) |
| **Activation** | Full SKILL.md loaded on-demand via `skill` tool call | Full skill body                  |
| **Execution**  | Agent follows instructions, uses bundled resources   | Varies by skill                  |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     LLM Context                          │
│                                                          │
│  System Prompt:                                          │
│    "You are scode..."                                    │
│    <available_skills>                                    │
│      <skill>                                             │
│        <name>welcome-me</name>                           │
│        <description>Greet new users...</description>     │
│      </skill>                                            │
│    </available_skills>                                   │
│    "Use the `skill` tool to load full instructions..."   │
│                                                          │
│  Conversation:                                           │
│    User: "load welcome skill please"                     │
│    Assistant: [calls skill("welcome-me")]                │
│    ← <skill_content>...full body...</skill_content>      │
│    Assistant: "Here's the architecture..."               │
└─────────────────────────────────────────────────────────┘
```

## Progressive Disclosure Flow

### 1. Discovery — `loadSkillMeta()`

**File:** `apps/server/src/skill/loader.ts`

On every user request, the server loads **only the YAML frontmatter** (name + description) from each skill's `SKILL.md`. The full body is **not** read.

```typescript
export function loadSkillMeta(
  dir: SkillDir,
): Effect<{ name: string; description: string } | null, SkillLoadError> {
  // Effect.try wraps readFileSync — actual I/O failures become typed SkillLoadError
  // Returns { name, description } — no body
}
```

What gets injected into the system prompt:

```xml
<available_skills>
  <skill>
    <name>welcome-me</name>
    <description>Greet new users, explain the scode client-server architecture, and suggest starter prompts.</description>
  </skill>
  <skill>
    <name>changelog</name>
    <description>Generate or update a CHANGELOG.md file from git history.</description>
  </skill>
  <skill>
    <name>documentation</name>
    <description>Generate or update project documentation — README, CONTRIBUTING, API docs, and project guides.</description>
  </skill>
</available_skills>
```

The LLM also receives the `skill` tool definition with its `name` parameter constrained to an `enum` of valid skill names — preventing hallucinated skill names.

### 2. Activation — `skill` Tool

**File:** `apps/server/src/tool/skill.ts`

When the LLM determines a task matches a skill's description, it calls the `skill` tool:

```
skill(name: "welcome-me")
```

The tool handler:

1. Calls `discover()` to find skill directories
2. Calls `loadSkill(dir)` to read the **full** SKILL.md (frontmatter + body)
3. Lists any extra files in the skill directory
4. Returns `<skill_content>` XML with full instructions

```typescript
return {
  name: "welcome-me",
  directory: "/path/to/.agents/skills/welcome-me",
  output: `<skill_content name="welcome-me">
# Welcome to scode

(instructions, workflows, gotchas...)

Base directory: /path/to/.agents/skills/welcome-me
</skill_content>`,
};
```

### 3. Execution

The skill body contains markdown instructions that the agent executes. Skills may reference:

- **Inline instructions** — step-by-step workflows in the markdown body
- **Bundled files** — scripts, templates, configs in the same directory
- **External references** — URLs to docs, APIs, etc.

Bundled files are listed as `<skill_files>`:

```xml
<skill_files>
  <file>/path/to/skill/template.txt</file>
  <file>/path/to/skill/script.sh</file>
</skill_files>
```

## Skill Matching

**File:** `apps/server/src/skill/matcher.ts`

Skills are matched using two-tier scoring:

```
user: "load welcome skill please"
                              ↓
              ┌── tokenize("load welcome skill please")
              │     → ["load", "welcome", "skill", "please"]
              │
              ├── for each skill:
              │     skillText = "welcome-me Greet new users..."
              │     skillTokens = ["welcome", "greet", "new", "users"...]
              │     exact = exactOverlap(prompt, skill)
              │     fuzzy = fuzzyOverlap(prompt, skill)
              │     score = exact > 0 ? exact : fuzzy
              │
              ├── filter score > 0, sort desc
              │     → ["welcome-me", "changelog", "documentation"]
              │
              └── append MAIN_SKILL fallback
                    → [matched..., MAIN_SKILL]
```

### Scoring Rules

| Condition                   | Example                                                 | Score            |
| --------------------------- | ------------------------------------------------------- | ---------------- |
| Exact token match           | `"weather"` in prompt matches `"weather"` in skill text | 1 per token      |
| No exact match, fuzzy match | `"welcome"` in prompt, `"welcome-me"` in skill text     | 1 per match      |
| No match at all             | `"quantum physics"` vs any skill                        | 0 → filtered out |

The `MAIN_SKILL` fallback is always appended at the end, ensuring the agent always has a general coding persona.

### Tokenizer

```typescript
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/-/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}
```

Stop words removed include: `the, a, an, is, are, was, were, be, i, me, my, we, you, your, this, that, what, how, why, do, does, can, will, to, of, in, for, on, at, by, from, and, or, but, not, please, help, like, want, need` and more.

## Multi-Client Discovery

**File:** `apps/server/src/skill/discover.ts`

Skills are discovered across all supported client directories, with **project-level > user-level** precedence:

| Agent            | Project (`<CWD>/`)     | User (`~/`)            |
| ---------------- | ---------------------- | ---------------------- |
| Cross-client std | `.agents/skills/`      | `.agents/skills/`      |
| OpenCode         | `.opencode/skills/`    | `.opencode/skills/`    |
| Claude Code      | `.claude/skills/`      | `.claude/skills/`      |
| Codex CLI        | `.codex/skills/`       | `.codex/skills/`       |
| Cursor           | `.cursor/skills/`      | —                      |
| Gemini CLI       | `.gemini/skills/`      | `.gemini/skills/`      |
| KiloCode         | `.kilocode/skills/`    | `.kilocode/skills/`    |
| CommandCode      | `.commandcode/skills/` | `.commandcode/skills/` |

Project-level directories are scanned first. User-level skills with the same name are shadowed (with a warning).

### Validation Rules

| Rule                                              | Enforced?         |
| ------------------------------------------------- | ----------------- |
| Valid YAML frontmatter                            | ✅ Strict         |
| `name` required (1-64 chars, lowercase + hyphens) | ✅ Strict         |
| `description` required, non-empty                 | ✅ Strict         |
| Description max 1024 chars                        | ✅ Strict         |
| Name matches directory                            | ⚠️ Lenient (warn) |
| No consecutive hyphens                            | ⚠️ Lenient (warn) |
| Unquoted colons in values                         | ✅ Auto-fix       |

## Skill Service (Effect Layer)

**File:** `apps/server/src/skill/service.ts`

```typescript
export class SkillService extends Context.Service<SkillService, {
  readonly discover: Effect.Effect<SkillDir[], SkillDiscoverError>;
  readonly loadSkill: (dir: SkillDir) => Effect.Effect<Skill | null, SkillLoadError>;
  readonly loadSkillMeta: (dir: SkillDir) => Effect.Effect<Meta | null, SkillLoadError>;
  readonly loadAllSkills: Effect.Effect<Skill[], SkillDiscoverError | SkillLoadError>;
  readonly matchSkills: (prompt: string, skills: Skill[]) => Skill[];
}>()("SkillService");
```

### Error Types

**File:** `apps/server/src/skill/error.ts`

```typescript
export class SkillDiscoverError extends Data.TaggedError("SkillDiscoverError")<{
  readonly reason: "read-error" | "no-skills-directory";
  readonly dir: string;
}> {}

export class SkillLoadError extends Data.TaggedError("SkillLoadError")<{
  readonly reason: "read-error" | "parse-error";
  readonly dir: string;
  readonly file?: string;
}> {}
```

### Method Summary

| Method          | Returns                | Reads Full Body? | Used When           |
| --------------- | ---------------------- | ---------------- | ------------------- |
| `discover`      | `SkillDir[]`           | No               | Listing directories |
| `loadSkillMeta` | `{name, description}`  | **No**           | Discovery phase     |
| `loadSkill`     | `Skill` (full)         | **Yes**          | Activation phase    |
| `loadAllSkills` | `Skill[]` (empty body) | **No**           | Each chat request   |
| `matchSkills`   | `Skill[]` (sorted)     | No               | Matching prompt     |

### `main` Skill — Matching Fallback

The `main` skill is a synthetic fallback defined in `matcher.ts`. It is always appended to matched skills:

- **Not included in** `<available_skills>`: would mislead the LLM into calling `skill("main")`
- **Used as system prompt preamble**: becomes the opening lines of the system prompt

## Debug Logging

Activate with `SCODE_DEBUG=1`:

```bash
SCODE_DEBUG=1 pnpm cli
```

Logs go to `logs/debug.log`. Sample output:

```
[INFO] [server:skill:discover] discovered skill directories
  { count: 3, dirs: ["welcome-me", "changelog", "documentation"] }
[LOG]  [server:skill:matcher] matching skills
  { prompt: "load welcome skill", tokens: ["load", "welcome", "skill"] }
[LOG]  [server:skill:matcher] match result
  { matched: ["welcome-me"], count: 1 }
```

### Debugging "Skill Not Found"

1. Enable `SCODE_DEBUG=1`
2. Check `logs/debug.log` for `server:skill:matcher` entries
3. Verify prompt tokens include skill keywords
4. Check `server:tool:skill` logs for available skills

## Skill Tool Error Handling

When called with an unknown name:

```json
{
  "error": "Skill \"welcom\" not found. Available skills: welcome-me, changelog, documentation. Did you mean: welcome-me?"
}
```

Includes: requested name, all available skills, fuzzy "Did you mean?" hint.

## File Reference

| File                                | Purpose                                                    |
| ----------------------------------- | ---------------------------------------------------------- |
| `apps/server/src/skill/discover.ts` | Directory scanning via `Effect.try` wrapping `readdirSync` |
| `apps/server/src/skill/loader.ts`   | Parse SKILL.md frontmatter + body                          |
| `apps/server/src/skill/matcher.ts`  | Pure functions — tokenize + score + rank                   |
| `apps/server/src/skill/service.ts`  | Effect layer with `Effect.gen` multi-step workflows        |
| `apps/server/src/skill/error.ts`    | Tagged errors (`SkillDiscoverError`, `SkillLoadError`)     |
| `apps/server/src/tool/skill.ts`     | `skill` tool handler with fuzzy matching                   |
| `apps/server/src/prompt/builder.ts` | Renders `<available_skills>` XML                           |
| `apps/server/src/chat/handler.ts`   | Orchestration — loads skills, matches, builds prompt       |

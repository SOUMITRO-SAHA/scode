# Skill System

scode implements a three-stage **progressive disclosure** skill system following the global agent skill standard:

```
Discovery → Activation → Execution
```

| Stage          | What Happens                                         | Context Cost                     |
| -------------- | ---------------------------------------------------- | -------------------------------- |
| **Discovery**  | Skill name + description loaded into system prompt   | Minimal (a few tokens per skill) |
| **Activation** | Full SKILL.md loaded on-demand via `skill` tool call | Full skill body                  |
| **Execution**  | Agent follows instructions, uses bundled files/tools | Varies by skill                  |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     LLM Context                             │
│                                                             │
│  System Prompt:                                             │
│    "You are scode..."                                       │
│    <available_skills>                                       │
│      <skill>                                                │
│        <name>welcome-me</name>                              │
│        <description>Greet new users...</description>        │
│      </skill>                                               │
│    </available_skills>                                      │
│    "Use the `skill` tool to load full instructions..."      │
│                                                             │
│  Conversation:                                              │
│    User: "load welcome skill please"                        │
│    Assistant: [calls skill("welcome-me")]                   │
│    ← <skill_content>...full body...</skill_content>         │
│    Assistant: "Here's the architecture..."                  │
└─────────────────────────────────────────────────────────────┘
```

---

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
  // null is a valid success (expected parse failure — e.g., missing frontmatter)
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

The LLM also receives the `skill` tool definition with its `name` parameter constrained to an `enum` of valid skill names — preventing the model from hallucinating nonexistent skill names.

### 2. Activation — `skill` Tool

**File:** `apps/server/src/tool/skill.ts`

When the LLM determines a task matches a skill's description, it calls the `skill` tool:

```
skill(name: "welcome-me")
```

The tool handler:

1. Calls `Effect.runSync(discover())` to find skill directories
2. Calls `Effect.runSync(loadSkill(dir))` to read the **full** SKILL.md (frontmatter + body)
3. Lists any extra files in the skill directory
4. Returns `<skill_content>` XML with full instructions

```typescript
return {
  name: "welcome-me",
  directory: "/path/to/.agents/skills/welcome-me",
  output: `<skill_content name="welcome-me">
# Welcome to scode

(scode architecture, starter prompts, gotchas...)

Base directory: /path/to/.agents/skills/welcome-me
</skill_content>`,
};
```

The LLM now has the full skill instructions in context.

### 3. Execution — Follow Instructions

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

---

## Skill Matching

**File:** `apps/server/src/skill/matcher.ts`

Skills are matched against the user's prompt using a two-tier scoring system:

```
user: "load welcome skill please"
                              ↓
              ┌── tokenize("load welcome skill please")
              │     → ["load", "welcome", "skill", "please"]
              │
              ├── for each skill:
              │     skillText = "welcome-me Greet new users..."
              │     skillTokens = ["welcome", "greet", "new", "users"...]
              │
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

| Condition                   | Example                                                                          | Score            |
| --------------------------- | -------------------------------------------------------------------------------- | ---------------- |
| Exact token match           | `"weather"` in prompt matches `"weather"` in skill text                          | 1 per token      |
| No exact match, fuzzy match | `"welcome"` in prompt, `"welcome-me"` in skill text → `"welcome" ⊆ "welcome-me"` | 1 per match      |
| No match at all             | `"quantum physics"` vs any skill                                                 | 0 → filtered out |

The `MAIN_SKILL` fallback is always appended at the end, ensuring the agent always has a general coding persona even when no skill matches.

### Tokenizer Details

```typescript
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // strip punctuation
    .replace(/-/g, " ") // split hyphens → "welcome-me" → "welcome me"
    .split(/\s+/) // split on whitespace
    .filter(
      (t) =>
        t.length > 2 && // remove 1-2 char tokens
        !STOP_WORDS.has(t),
    ); // remove stop words
}
```

Stop words removed: `the, a, an, is, are, was, were, be, i, me, my, we, you, your, this, that, what, how, why, do, does, can, will, to, of, in, for, on, at, by, from, and, or, but, not, please, help, like, want, need` and more.

---

## Skill Directory Structure

Skills live under `.agents/skills/` (for runtime skills) and `.opencode/skills/` (for development skills — never loaded by server):

```
.agents/skills/
├── welcome-me/
│   └── SKILL.md
├── changelog/
│   └── SKILL.md
└── documentation/
    └── SKILL.md
```

### SKILL.md Format

Each skill is a markdown file with YAML frontmatter:

```markdown
---
name: welcome-me
description: Greet new users, explain the scode client-server architecture, and suggest starter prompts.
---

# Skill Name

Full instructions, workflow steps, examples, and gotchas.
```

**Frontmatter fields:**

| Field         | Required | Description                                                                                             |
| ------------- | -------- | ------------------------------------------------------------------------------------------------------- |
| `name`        | Yes      | Lowercase hyphen-separated identifier. Must match directory name. Max 64 chars. No consecutive hyphens. |
| `description` | Yes      | One-line summary shown during discovery phase. Non-empty, max 1024 chars.                               |
| Any           | No       | Custom fields (e.g., `compatibility`, `metadata`). Ignored by parser.                                   |

### Multi-client discovery

**File:** `apps/server/src/skill/discover.ts`

Skills are discovered across all supported client directories, then merged with **project-level > user-level** precedence:

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

All project-level directories are scanned first (higher precedence). Then user-level directories — any name that already exists from a project scan is skipped (shadowed), with a warning logged. This allows skills installed by different agents to coexist and interoperate.

**Validation rules** (`apps/server/src/skill/loader.ts`):

| Rule                        | Spec Constraint                                              | Enforced?                                |
| --------------------------- | ------------------------------------------------------------ | ---------------------------------------- |
| File must start with `---`  | YAML frontmatter delimiter                                   | ✅ Strict — must parse                   |
| Valid YAML frontmatter      | Parseable YAML                                               | ✅ Strict — must parse                   |
| `name` required             | 1-64 chars, lowercase alphanumeric + hyphens                 | ✅ Strict — must be present              |
| Name matches directory      | Must match parent directory name exactly                     | ⚠️ Lenient — warn only                   |
| Name max length             | 64 chars max                                                 | ⚠️ Lenient — warn only                   |
| No consecutive hyphens      | `--` not allowed in name                                     | ⚠️ Lenient — warn only                   |
| No leading/trailing hyphens | Name must not start or end with `-`                          | ⚠️ Lenient — warn only                   |
| `description` required      | Per spec: required non-empty field                           | ✅ Strict — reject if missing/empty      |
| Description max length      | 1024 chars max                                               | ✅ Strict — reject if exceeded           |
| Unquoted colons in values   | Common YAML issue — colons in values parse as nested objects | ✅ Auto-fix: wraps in quotes and retries |
| No unicode in name          | Spec says "unicode lowercase alphanumeric" — currently `a-z` | ⚠️ ASCII only (lenient)                  |

> **Lenient vs strict**: Per the [Adding Skills Support guide](https://agentskills.io/adding-skills-support), name format issues (mismatch, length, hyphens) emit a warning but the skill is still loaded for cross-client compatibility. Only missing/empty description and unparseable YAML cause rejection — a description is essential for the discovery phase to work.

> **Note on unicode names:** The spec allows unicode lowercase alphanumeric characters, but scode currently limits to ASCII `a-z`. This may be relaxed in a future release. Submit a PR if unicode skill names are needed.

---

## Skill Service (Effect Layer)

**File:** `apps/server/src/skill/service.ts`

The skill system is wrapped in an Effect-based service with error handling:

```typescript
export class SkillService extends Context.Service<SkillService, {
  readonly discover: Effect.Effect<SkillDir[], SkillDiscoverError>;
  readonly loadSkill: (dir: SkillDir) => Effect.Effect<Skill | null, SkillLoadError>;
  readonly loadSkillMeta: (dir: SkillDir) => Effect.Effect<Meta | null, SkillLoadError>;
  readonly loadAllSkills: Effect.Effect<Skill[], SkillDiscoverError | SkillLoadError>;
  readonly matchSkills: (prompt: string, skills: Skill[]) => Skill[];
}>()("SkillService");
```

### Error Type System

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

| Error                | \_tag                  | Causes                                           | Recovery                        |
| -------------------- | ---------------------- | ------------------------------------------------ | ------------------------------- |
| `SkillDiscoverError` | `"SkillDiscoverError"` | `readdir` failure, missing `.agents/skills/` dir | `Effect.orElseSucceed` → `[]`   |
| `SkillLoadError`     | `"SkillLoadError"`     | `readFile` failure, invalid YAML frontmatter     | `Effect.orElseSucceed` → `null` |

I/O functions return `Effect.try(syncOp)` — actual failures become typed errors, not runtime exceptions.

### Effect Patterns Used

| Pattern                 | Usage                                                         |
| ----------------------- | ------------------------------------------------------------- |
| `Effect.try(syncFn)`    | Wrap `readdirSync` / `readFileSync` at I/O boundaries         |
| `Effect.gen(function*)` | Multi-step workflows with `yield* discover()`                 |
| `Effect.map`            | Transform success values                                      |
| `Effect.tap`            | Chain side-effects (debug logging) without changing the value |
| `Effect.orElseSucceed`  | Recover from typed errors with a fallback value               |
| `Effect.catchTag`       | Recover from a specific tagged error variant                  |
| `Effect.runSync`        | Bridge Effect → sync at the outermost boundary (API routes)   |
| `Effect.runPromise`     | Bridge Effect → Promise at the async boundary (tool handlers) |

| Method          | Returns                | Reads Full Body? | Used When                          |
| --------------- | ---------------------- | ---------------- | ---------------------------------- |
| `discover`      | `SkillDir[]`           | No               | Listing available directories      |
| `loadSkillMeta` | `{name, description}`  | **No**           | Discovery phase — only frontmatter |
| `loadSkill`     | `Skill` (full)         | **Yes**          | Activation phase — `skill` tool    |
| `loadAllSkills` | `Skill[]` (empty body) | **No**           | Each chat request — lightweight    |
| `matchSkills`   | `Skill[]` (sorted)     | No               | Matching prompt to skills          |

**The `loadSkill` (full body) is intentionally separate from `loadSkillMeta` (frontmatter only).** This ensures the full SKILL.md body is only read from disk **on-demand**, when the LLM calls the `skill` tool.

### `main` Skill — Matching Fallback, Not Listed

The `main` skill is a synthetic fallback defined in `matcher.ts`. It is **always** appended to the matched skills list so the LLM always has a default persona. However, `buildPrompt` filters it out of `<available_skills>` — it never appears as a loadable option:

- **Included in `<available_skills>`**: ❌ (would mislead the LLM into calling `skill("main")`, which would fail)
- **Used as system prompt preamble**: ✅ The `main` skill's `body` becomes the opening lines of the system prompt. If `body` is empty or no `main` skill exists, a hardcoded fallback is used.

---

## Debug Logging

Activate with `SCODE_DEBUG=1` environment variable:

```bash
SCODE_DEBUG=1 scode
# or
SCODE_DEBUG=1 pnpm cli
```

Logs are written to `logs/debug.log` (relative to CWD). In Effect-based code, debug logging is chained via `Effect.tap`:

```typescript
discover().pipe(
  Effect.tap((dirs) =>
    Effect.sync(() =>
      DebugLogger("server:skill:discover").log("discovered skill directories", {
        count: dirs.length,
      }),
    ),
  ),
);
```

`Effect.tap` runs the side-effect (logging) without affecting the success value or error channel.

Sample output:

```
[INFO] [server:skill:discover] discovered skill directories
  { count: 3, dirs: ["welcome-me", "changelog", "documentation"] }

[LOG]  [server:skill:loader] loaded skill meta
  { name: "welcome-me", description: "Greet new users..." }

[LOG]  [server:skill:matcher] matching skills
  { prompt: "load welcome skill", tokens: ["load", "welcome", "skill"] }

[LOG]  [server:skill:matcher] skill score
  { name: "welcome-me", exact: 1, fuzzy: 1, score: 1 }

[LOG]  [server:skill:matcher] match result
  { matched: ["welcome-me"], count: 1 }

[LOG]  [server:tool:skill] skill tool called
  { name: "welcome-me", available: ["welcome-me", "changelog", "documentation"] }

[LOG]  [server:handler] skill matching result
  { prompt: "...", totalSkills: 3, matchedSkills: ["welcome-me", "main"] }
```

### Debugging a "Skill Not Found" Error

If the LLM reports a skill is not available:

1. Enable `SCODE_DEBUG=1`
2. Check `logs/debug.log` for `server:skill:matcher` entries
3. Verify the prompt tokens include keywords from the skill's name or description
4. Check `server:tool:skill` logs to see what skills were available when the tool was called
5. The error message from the skill tool now includes all available skills: `Skill "welcome" not found. Available skills: welcome-me, changelog, documentation. Did you mean: welcome-me?`

---

## Skill Tool Error Handling

**File:** `apps/server/src/tool/skill.ts`

The handler uses `Effect.gen` with `Effect.runPromise` bridge:

```typescript
const handler: ToolHandler = async ({ name }) => {
  const effect = Effect.gen(function* () {
    const dirs = yield* discover();
    // ... find by name, fuzzy fallback ...
    const skill = yield* loadSkill(dir);
    return { output: buildSkillContent(skill, dir) };
  });
  return Effect.runPromise(effect);
};
```

When the `skill` tool is called with an unknown name:

```json
{
  "error": "Skill "welcom" not found. Available skills: welcome-me, changelog, documentation. Did you mean: welcome-me?"
}
```

The response includes:

- The requested name
- A list of **all available skills** (so the LLM can self-correct)
- A fuzzy "Did you mean?" hint if a similar name exists

---

## Verification Against the Standard

| Standard                                                          | scode Implementation                                                                                                | Status |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------ |
| **Discovery**: Only name + description at startup                 | `loadSkillMeta()` reads only frontmatter. System prompt includes `<available_skills>` with name + description only. | ✅     |
| **Activation**: Full SKILL.md loads on-demand when task matches   | `skill` tool calls `loadSkill()` which reads full body.                                                             | ✅     |
| **Execution**: Follow instructions, optionally load bundled files | Skill body returned as `<skill_content>`. Extra files listed as `<skill_files>`.                                    | ✅     |
| **Small context footprint**                                       | Only name + description in system prompt. Full body only when `skill` tool is called.                               | ✅     |
| **Many skills on hand**                                           | Discovery is O(n). Matching is keyword + fuzzy. Full body is lazy-loaded per activation.                            | ✅     |
| **Typed error handling**                                          | `Effect.try` at I/O boundaries, tagged errors (`SkillDiscoverError`, `SkillLoadError`) propagated through Effect.   | ✅     |
| **No silent catch-all**                                           | Every `discover()`/`loadSkill()` failure is a typed Effect error; no blanket try/catch swallowing exceptions.       | ✅     |
| **Effect.gen composition**                                        | Multi-step workflows use `Effect.gen` with `yield*` instead of nested flatMap chains.                               | ✅     |
| **Name: max 64 chars**                                            | Warn-only (lenient). `warnNameIssues()` logs, skill still loaded.                                                   | ⚠️     |
| **Name: no consecutive hyphens**                                  | Warn-only (lenient).                                                                                                | ⚠️     |
| **Name: matches directory**                                       | Warn-only (lenient).                                                                                                | ⚠️     |
| **Description required**                                          | Strict reject if missing or empty.                                                                                  | ✅     |
| **Description max 1024 chars**                                    | Strict reject if exceeded.                                                                                          | ✅     |
| **YAML colon fallback**                                           | Auto-retry with quoted values when string fields parse as objects due to unquoted colons.                           | ✅     |
| **Name: unicode support**                                         | Spec allows unicode lowercase alphanumeric; current regex limits to `a-z`.                                          | ⚠️     |
| **MAIN_SKILL not in `<available_skills>`**                        | Fallback skill is not a real skill directory; filtered out by `buildPrompt`.                                        | ✅     |
| **MAIN_SKILL body used as preamble**                              | Synthetic `main` skill's `body` becomes system prompt opening instead of hardcoded text.                            | ✅     |
| **Multi-client scanning**                                         | Scans 5 client dirs + `.agents/skills/` at both project and user levels.                                            | ✅     |
| **Skill tool `name` constrained**                                 | Tool definition uses `enum` of valid skill names instead of generic `string`.                                       | ✅     |
| **Collision detection**                                           | Warns when user-level skill is shadowed by project-level.                                                           | ✅     |

---

## API Endpoints

### `GET /api/v1/skills`

List all skills (name + description only — **Discovery phase**):

```json
{
  "skills": [
    {
      "name": "changelog",
      "description": "Generate or update a CHANGELOG.md..."
    },
    {
      "name": "documentation",
      "description": "Generate or update project documentation..."
    },
    {
      "name": "welcome-me",
      "description": "Greet new users, explain the scode..."
    }
  ]
}
```

### `GET /api/v1/skills/:name`

Get a single skill's full content (includes body — **Activation phase**):

```json
{
  "name": "welcome-me",
  "description": "Greet new users...",
  "body": "# Welcome to scode\n\n## Architecture..."
}
```

### `POST /api/v1/skills/validate`

Validate all skill directories:

```json
{
  "results": [
    { "name": "changelog", "valid": true, "error": null },
    { "name": "documentation", "valid": true, "error": null },
    { "name": "welcome-me", "valid": true, "error": null }
  ]
}
```

---

## File Reference

| File                                              | Phase         | Purpose                                                                                        |
| ------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------- |
| `apps/server/src/skill/discover.ts`               | Discovery     | `discover()` returns `Effect<SkillDir[], SkillDiscoverError>`. Effect.try wraps `readdirSync`. |
| `apps/server/src/skill/loader.ts`                 | Both          | `loadSkillMeta()` / `loadSkill()` return `Effect<..., SkillLoadError>`. I/O via `Effect.try`.  |
| `apps/server/src/skill/matcher.ts`                | Discovery     | Pure functions (no I/O). Tokenize + score prompt vs skill name/description.                    |
| `apps/server/src/skill/service.ts`                | Both          | Effect layer. Uses `Effect.gen` with `yield*` for multi-step workflows.                        |
| `apps/server/src/skill/error.ts`                  | Error         | `SkillDiscoverError` + `SkillLoadError` tagged errors (`Data.TaggedError`).                    |
| `apps/server/src/tool/skill.ts`                   | Activation    | `Effect.gen` + `Effect.runPromise` bridge. Fuzzy matching on unknown names.                    |
| `apps/server/src/prompt/builder.ts`               | Discovery     | Renders `<available_skills>` XML into system prompt.                                           |
| `apps/server/src/chat/handler.ts`                 | Orchestration | Inline `Effect.runSync` / `Effect.orElseSucceed` / `Effect.catchTag`.                          |
| `apps/server/src/__tests__/matcher.test.ts`       | Tests         | 17 test cases covering exact, fuzzy, hyphenated matching.                                      |
| `apps/server/src/__tests__/skill-service.test.ts` | Tests         | Service layer wiring tests — mocks use `Effect.succeed(...)`.                                  |

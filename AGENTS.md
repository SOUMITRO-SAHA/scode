# Architecture

scode uses a **client-server** architecture:

- **CLI** (`apps/cli/`) — thin client only. No AI logic. On startup, checks if server is running; if yes, connects; if not, spawns it as a child process.
- **Server** (`apps/server/`) — singleton process. All skill discovery, matching, prompt building, and LLM calls happen here. Serves multiple CLI agents concurrently.

# Project Structure

```
scode/
├── apps/
│   ├── cli/
│   │   ├── src/
│   │   │   ├── index.tsx      # CLI entrypoint — creates renderer, handles --prompt mode
│   │   │   ├── app.tsx        # React TUI component with OpenTUI (header, output, input, streaming)
│   │   │   ├── components/
│   │   │   │   ├── layout/    # header, session-sidebar, landing
│   │   │   │   ├── chat/      # chat-area, assistant-message, user-message
│   │   │   │   ├── commands/  # command-palette, model-switcher, commands
│   │   │   │   ├── composer/  # composer, autocomplete-dropdown, use-autocomplete
│   │   │   │   ├── feedback/  # thinking-panel, tip-section, keyboard-hints
│   │   │   │   ├── error/     # error-boundary, error-component
│   │   │   │   └── ui/        # dialog, toast, spinner, icon (generalized)
│   │   │   ├── hooks/         # useApi, useStreamChat, useTips
│   │   │   ├── services/      # api client, daemon, init, shutdown
│   │   │   ├── store/         # Zustand state management
│   │   │   ├── styles/        # syntaxTheme for markdown
│   │   │   └── commands/      # command definitions
│   │   ├── package.json       # @scode/cli — deps: @opentui/core, @opentui/react, react
│   │   └── tsconfig.json      # JSX with @opentui/react, @/* path alias
│   └── server/
│       ├── src/
│       │   ├── index.ts       # Hono server — /health, /process (discover→match→load→build→Claude→stream)
│       │   ├── types.ts       # Shared types (Skill, ToolDefinition, StreamEvent, etc.)
│       │   ├── skill/
│       │   │   ├── discover.ts # Walk .agents/skills/ → SkillDir[]
│       │   │   ├── matcher.ts  # keyword-match prompt → relevant skills
│       │   │   └── loader.ts   # Read & parse SKILL.md (YAML frontmatter + body)
│       │   ├── claude/
│       │   │   └── client.ts   # Anthropic SDK wrapper, streaming, tool_use support
│       │   ├── prompt/
│       │   │   └── builder.ts  # Build Messages from matched skills + tool defs
│       │   └── tool/
│       │       ├── registry.ts # Tool registry: register, definitions, settle
│       │       ├── read.ts     # Read files/directories
│       │       ├── write.ts    # Write/create files
│       │       ├── edit.ts     # Exact string replacement
│       │       ├── bash.ts     # Shell commands
│       │       ├── grep.ts     # Regex content search
│       │       └── glob.ts     # Glob pattern file search
│       ├── package.json       # @scode/server — deps: hono, @hono/node-server, @anthropic-ai/sdk, yaml
│       └── tsconfig.json
├── .agents/
│   └── skills/
│       ├── welcome-me/        # Greet new users
│       ├── changelog/         # Generate changelogs from git history
│       └── documentation/     # Generate/update project docs
├── .env.example               # ANTHROPIC_API_KEY placeholder
├── package.json               # Root workspace scripts: cli, server, demo, dev:cli, dev:server
├── tasks/
│   ├── TODO.md                # Current TODO
│   └── PLAN.md                # Architecture plan
└── AGENTS.md                  # This file
```

# Core Flow

```
scode (terminal)
  → CLI init: check if server already running (health check on port 4100)
  → If running → connect to existing server
  → If not running → spawn server as child process, poll until healthy, then connect
  → Send user prompt to server via HTTP POST /process
  → Server: discover → match → load → build → call Claude with tools
  → Claude may call tools (read, write, bash, grep, glob, edit) — server executes them, returns results
  → Claude generates final response
  → CLI receives streamed response via chunked transfer → display to terminal
```

# Mandatory Skills

Always load these skills when working on any task:

- **effect** — for Effect v4 / effect-smol code
- **ralph-loop** — for auto-continuing until task completion
- **caveman** — with intensity `ultra` for token efficiency

# Task Management Workflow

Before starting any new task, update `tasks/TODO.md` and `tasks/PLAN.md`.

If the current `tasks/TODO.md` and `tasks/PLAN.md` are not completed, do **not** proceed with any new task.

Once a task is completed:

1. Move `tasks/PLAN.md` and `tasks/TODO.md` into `tasks/completed/<task_name>/`
2. Then start the new task by creating fresh `tasks/TODO.md` and `tasks/PLAN.md`

# Code Conventions

## File naming

Files follow different conventions based on their type:

**React components:** kebab-case — `dialog.tsx`, `command-palette.tsx`, `login-form.tsx`

**Hooks:** camelCase with `use` prefix — `useAutocomplete.ts`, `useHistory.ts`, `useStreamChat.ts`

**Other files:** camelCase — `layout.ts`, `types.ts`, `syntaxTheme.ts`, `commands.ts`

**Component directories:** kebab-case — `ui/button.tsx`, `forms/login-form.tsx`

## Path aliases

Use `@/` for cross-directory imports (maps to `./src/*`). Same-directory imports use `./`:

```typescript
// Cross-directory ✅
import { useAppStore } from "@/store/index";
import { Composer } from "@/components/composer/index";

// Same-directory ✅
import { AutocompleteDropdown } from "./autocomplete-dropdown";

// Deep relative ❌
import { useAppStore } from "../../store/index";
```

# Key Design Decisions

- **CLI is client-only** — no AI logic in CLI. Thin client that forwards prompts to server and streams responses.
- **No `.js` extensions** — never use `.js` suffix in imports. tsx resolves extensionless imports natively. All imports are plain `"./foo"` not `"./foo.js"`.
- **Singleton server** — one process serves all CLI invocations. Server holds API keys, model connections, and skill cache.
- **Auto lifecycle** — CLI spawns server if not running; server stays alive until idle timeout or explicit shutdown.
- **Transport**: HTTP/TCP with JSON health checks, streaming via Hono's `stream()` (chunked transfer).
- **Skills location**: `.agents/skills/` (plural).
- **Tool loop**: Single-turn prompt → Claude calls tools → server executes → feeds results back. Max 10 iterations.
- **Model**: `claude-sonnet-4-20250515` via Anthropic SDK, streaming with `tool_use` support.

# Testing (TDD)

**This project follows TDD — write tests first, then implement.** Every package uses vitest with coverage via `@vitest/coverage-v8`.

- `pnpm test` — run all workspace tests (vitest, 155 tests across shared, theme, cli, server)
- `pnpm --filter <package> test -- --coverage` — run tests with coverage for a specific package
- Every package has `"test": "vitest run"` script. Run per-package: `pnpm --filter <package> test`
- Test files live in `src/__tests__/` alongside source, named `<module>.test.ts`
- Files in `src/__tests__/` and `*.test.*` are excluded from tsconfig so `check-types` stays clean
- `pnpm check-types` — type check all packages
- Tests must pass before committing. No exceptions for TDD — write test first, then code until it passes.
- Coverage thresholds: target 100% lines/funcs/branches for pure logic. Type-only exports are excluded. Heavy I/O (DB, LLM, subprocess) tested through mocked interfaces.

# Skill Matching

- Simple keyword-based: tokenizes prompt and skill metadata, counts keyword overlap
- Returns matched skills + always includes `main` fallback skill
- "What's the weather?" → no skills matched → only `main` fallback (correct behavior)

# Non-obvious Project Facts

## Package conventions

- `@scode/shared` uses subpath exports (`"./logger"`, `"./constants"`) — no root `"."` export. Import as `@scode/shared/logger`, not `@scode/shared`.
- `@scode/theme` uses single root export (`"."`). Zero runtime dependencies.
- Neither `@scode/shared` nor `@scode/theme` have tsconfig paths or project references — resolution relies entirely on pnpm workspace + bundler (tsx).

## Dev startup

- Root `pnpm cli` tries `bun` first (silent stderr redirect), falls back to `tsx` — bun is faster for dev.

## Ignored directories

- `tasks/` is entirely gitignored (`tasks/.gitignore` contains `*`) — TODO/PLAN files are local only.
- `docs/.gitignore` explicitly excludes `prd.md` (the assignment spec) but allows other `docs/prd/` files.
- `.opencode/` is gitignored (`*` in `.opencode/.gitignore`).

## TypeScript version divergence

- Root: 5.9.2. CLI/server devDeps: ^5.8.3. Theme/shared: ^6.0.3. Web: ~6.0.2.
- Theme and shared run ahead of consumer packages. Can cause resolution/emit differences between `tsx` runtime and `tsc`.

## Prompt redundancy

- Prompt builder starts system prompt with "You are scode..." AND MAIN_SKILL body also starts with "You are scode..." — slightly different wording, both end up in context.

## API calling convention

- All HTTP calls use `apiFetch<T>()` or `apiFetchStream()` from `@scode/shared/utils`
- `axios` is imported in exactly one place: `packages/shared/src/utils/api.ts`
- Never import `axios` directly in callers — always go through the shared utils

## Two separate skill systems

- `.agents/skills/` = runtime skills for the scode AI agent (welcome-me, changelog, documentation).
- `.opencode/skills/` = development skills for the AI coding agent building scode (opencode, opentui, effect, toon).
- Server only reads `.agents/skills/`. The `.opencode/` skills are never loaded at runtime.

## Disconnected web app

- `apps/web/` is a standalone Vite+React scaffold with zero internal monorepo dependencies. NOT integrated with the scode server. Uses React Compiler for auto-memoization.

## Three routes, one handler

- Server has 3 routes that all call the same `chatStream` handler: `POST /process` (legacy, mounted in `apps/server/src/index.ts`), `POST /api/v1/chat`, and `POST /api/v1/process` (both in the v1 router). They are identical.

## Path alias usage

- `apps/cli/tsconfig.json` defines `paths: {"@/*": ["./src/*"]}` — use `@/` for cross-directory imports.
- Same-directory imports use `./` (e.g., `./autocomplete-dropdown`).
- Deep relative paths like `../../` are avoided — use `@/` instead.

## Dev mode divergence (CLI vs Server)

- `pnpm dev:cli` uses `bun scripts/dev-cli.ts` (custom `node:fs.watch` script) because OpenTUI's native FFI crashes under `tsx watch` (Node runtime).
- `pnpm dev:server` uses `tsx watch src/index.ts` — server has no native FFI so `tsx watch` works fine.

## Stream API quirks

- `apiFetchStream` returns a `Readable` stream regardless of HTTP status code — **no 2xx check**. Callers discover 4xx/5xx errors only when reading chunks.
- `apiFetchStream` lacks abort signal / timeout support (unlike `apiFetch<T>` which accepts `RequestInit` with `signal`).
- Server sends raw text chunks (not SSE/JSON). Both CLI callers decode raw `Uint8Array` via `TextDecoder` with `{ stream: true }` for multi-byte UTF-8 safety.

## TypeScript version convergence

- Previous "5.x vs 6.x divergence" is obsoleted: all packages now use `"typescript": "catalog:"` → `^6.0.3` via pnpm catalog (except root which also uses catalog). Resolution differences between `tsx` and `tsc` may still occur but the version gap is gone.

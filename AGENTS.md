# Architecture

scode uses a **client-server** architecture:

- **CLI** (`apps/cli/`) — thin client only. No AI logic. On startup, checks if server is running; if yes, connects; if not, spawns it as a child process.
- **Server** (`apps/server/`) — singleton process. All skill discovery, matching, prompt building, and LLM calls happen here. Serves multiple CLI agents concurrently.

# Documentation

Full project documentation is in [`docs/`](docs/index.md) — setup, CLI usage, server API reference, architecture, skills, development. Refer there for detailed user-facing docs.

# Project Structure

```
scode/
├── apps/
│   ├── cli/
│   │   ├── src/
│   │   │   ├── index.tsx         # CLI entrypoint — creates renderer, handles --prompt mode
│   │   │   ├── app.tsx           # React TUI component with OpenTUI
│   │   │   ├── components/
│   │   │   │   ├── layout/       # header, session-sidebar, landing, main-content
│   │   │   │   ├── chat/         # chat-area, assistant-message, user-message
│   │   │   │   ├── commands/     # command-palette, model-switcher, commands, skill-browser
│   │   │   │   ├── composer/     # composer, autocomplete-dropdown, use-autocomplete
│   │   │   │   ├── feedback/     # thinking-panel, tip-section, keyboard-hints
│   │   │   │   ├── error/        # error-boundary, error-component
│   │   │   │   └── ui/           # dialog, toast, spinner, icon
│   │   │   ├── headless/         # config, run-prompt, run-repl, run, types
│   │   │   ├── hooks/            # useApi, useStreamChat, useStreaming, useTips, useKeyboardShortcuts
│   │   │   ├── services/         # api, bootstrap, client, config, daemon, shutdown, errors
│   │   │   ├── store/            # Zustand state management
│   │   │   ├── styles/           # syntaxTheme for markdown
│   │   │   ├── types/            # Shared type definitions
│   │   │   ├── utils/            # clipboard, selection helpers
│   │   │   └── commands/         # Command definitions
│   │   ├── package.json          # @scode/cli — deps: @opentui/core, @opentui/react, react, zustand
│   │   └── tsconfig.json         # JSX with @opentui/react, @/* path alias
│   └── server/
│       ├── src/
│       │   ├── index.ts          # Hono server entrypoint — mounts routes, starts on port 4100
│       │   ├── types.ts          # Shared types (Skill, ToolDefinition, StreamEvent, etc.)
│       │   ├── api/
│       │   │   └── v1/
│       │   │       └── index.ts  # v1 router — all REST endpoints
│       │   ├── chat/
│       │   │   └── handler.ts    # handleChat — main conversation loop
│       │   ├── config/
│       │   │   ├── manager.ts    # Server configuration management
│       │   │   └── service.ts    # ConfigService Effect layer
│       │   ├── db/
│       │   │   ├── client.ts     # SQLite via better-sqlite3 + Drizzle ORM
│       │   │   └── schema.ts     # Sessions table schema
│       │   ├── llm/
│       │   │   ├── claude/       # Anthropic SDK adapter
│       │   │   ├── gemini/       # Google Gemini adapter
│       │   │   ├── openai-compat/# OpenAI-compatible providers (DeepSeek, Z.ai, MiniMax, OpenAI)
│       │   │   ├── commandcode/  # CommandCode adapter (raw fetch)
│       │   │   ├── provider.ts   # LLMProvider interface
│       │   │   ├── provider-service.ts  # ProviderService Effect layer
│       │   │   ├── registry.ts   # ProviderRegistry
│       │   │   ├── executor.ts   # Retry logic, error classification
│       │   │   ├── config.ts     # resolveApiKey from auth.json / env vars
│       │   │   ├── error.ts      # LLMError hierarchy
│       │   │   └── types.ts      # Re-exports shared types
│       │   ├── prompt/
│       │   │   └── builder.ts    # Build Messages from matched skills + tool defs
│       │   ├── services/
│       │   │   ├── app.ts        # AppLayer, ManagedRuntime
│       │   │   ├── index.ts      # Service exports
│       │   │   └── logger.ts     # Server-side logging
│       │   ├── session/
│       │   │   ├── manager.ts    # Session CRUD with SQLite
│       │   │   ├── service.ts    # SessionService Effect layer
│       │   │   ├── active-clients.ts     # Active client tracking
│       │   │   └── active-clients-service.ts
│       │   ├── skill/
│       │   │   ├── discover.ts   # Walk skill directories → SkillDir[]
│       │   │   ├── matcher.ts    # keyword-match prompt → relevant skills
│       │   │   ├── loader.ts     # Read & parse SKILL.md (YAML frontmatter + body)
│       │   │   ├── service.ts    # SkillService Effect layer
│       │   │   └── error.ts      # SkillDiscoverError, SkillLoadError
│       │   └── tool/
│       │       ├── registry.ts   # Tool registry: register, definitions, settle
│       │       ├── read.ts       # Read files/directories
│       │       ├── write.ts      # Write/create files
│       │       ├── edit.ts       # Exact string replacement
│       │       ├── bash.ts       # Shell commands
│       │       ├── grep.ts       # Regex content search
│       │       ├── glob.ts       # Glob pattern file search
│       │       ├── skill.ts      # "skill" tool to load skills dynamically
│       │       ├── service.ts    # ToolService Effect layer
│       │       └── index.ts
│       ├── package.json          # @scode/server — deps: hono, @anthropic-ai/sdk, @google/genai, etc.
│       └── tsconfig.json
│   └── web/
│       ├── package.json          # Standalone Vite+React (not integrated with server)
│       └── src/
├── .agents/
│   └── skills/
│       ├── welcome-me/           # Greet new users
│       ├── changelog/            # Generate changelogs from git history
│       └── documentation/        # Generate/update project docs
├── packages/
│   ├── shared/
│   │   ├── package.json          # @scode/shared — types, utils, logger, constants
│   │   └── src/
│   │       ├── constants/        # api-routes, defaults, effort, endpoints, limits, paths, providers
│   │       ├── effect/           # Effect utilities
│   │       ├── logger/           # Pino-based logging
│   │       ├── types/            # api, entities, stream types
│   │       └── utils/            # api, error, id, json, model, number, string, time
│   └── theme/
│       ├── package.json          # @scode/theme — zero runtime deps
│       └── src/                  # colors, layout, spacing, tokens, typography
├── docs/                         # Full project documentation
│   ├── index.md
│   ├── getting-started/
│   ├── cli/
│   ├── server/
│   ├── architecture/
│   ├── skills/
│   ├── packages/
│   └── development/
├── .env.example                  # API key env vars reference
├── package.json                  # Root workspace scripts
├── pnpm-workspace.yaml           # Workspace + catalog config
├── turbo.json                    # Turborepo pipeline
├── vitest.workspace.ts           # Vitest workspace
├── tasks/
│   ├── TODO.md                   # Current TODO
│   └── PLAN.md                   # Architecture plan
└── AGENTS.md                     # This file
```

# Core Flow

```
scode (terminal)
  → CLI init: check if server already running (health check on port 4100)
  → If running → connect to existing server
  → If not running → spawn server as child process, poll until healthy, then connect
  → Send user prompt to server via HTTP POST /api/v1/chat
   → Server: discover → match → load → build → call LLM with tools
   → LLM may call tools (read, write, bash, grep, glob, edit, skill) — server executes them, returns results
   → LLM generates final response
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
- **Tool loop**: Single-turn prompt → LLM calls tools → server executes → feeds results back. Max 10 iterations.
- **Default model**: `claude-sonnet-4-20250515` via Anthropic SDK, streaming with `tool_use` support.

# Testing (TDD)

**This project follows TDD — write tests first, then implement.** Every package uses vitest with coverage via `@vitest/coverage-v8`.

- `pnpm test` — run all workspace tests via turbo
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

- Root `pnpm cli` tries `bun` first (silent stderr redirect), falls back to `tsx` — bun is faster for dev. `--prompt` args reach tsx fallback (when bun isn't available); for TUI-only sessions bun is used.
- pnpm appends extra args to the **end of the entire command string**, not as positional params. With `bun X || tsx Y --prompt "text"`, the args only reach `tsx Y`. `$@` doesn't help because pnpm doesn't pass args as shell positional parameters.
- Fix: `scripts/cli.sh` is a bash wrapper that inspects `$@` for `--prompt` and routes to tsx directly, avoiding bun. Without `--prompt`, it tries bun first then falls back to tsx.
- `SCODE_DEBUG=1 pnpm cli` in a script can fail with newer pnpm versions because `pnpm cli` may be interpreted as a subcommand rather than `pnpm run cli`. Use `pnpm exec tsx ...` or `bun ...` directly instead.

## Ignored directories

- `tasks/` is entirely gitignored (`tasks/.gitignore` contains `*`) — TODO/PLAN files are local only.
- `docs/.gitignore` explicitly excludes `prd.md` (the assignment spec) but allows other `docs/prd/` files.
- `.opencode/` is gitignored (`*` in `.opencode/.gitignore`).

## Prompt redundancy

- Prompt builder starts system prompt with "You are scode..." AND MAIN_SKILL body also starts with "You are scode..." — slightly different wording, both end up in context.

## API calling convention

- All HTTP calls use `apiFetch<T>()` or `apiFetchStream()` from `@scode/shared/utils`
- `axios` is imported in exactly one place: `packages/shared/src/utils/api.ts`
- Never import `axios` directly in callers — always go through the shared utils

## Two separate skill systems

- `.agents/skills/` = runtime skills for the scode AI agent (welcome-me, changelog, documentation).
- `.opencode/skills/` = development skills for the AI coding agent building scode (opencode, opentui, effect, toon, t3code).
- Server only reads `.agents/skills/`. The `.opencode/` skills are never loaded at runtime.

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

## Provider ID consistency (two sources of truth)

- Provider adapter IDs are defined in `apps/server/src/llm/provider-service.ts` (`"claude"`, `"gemini"`, `"deepseek"`, `"zai"`, `"minimax"`, `"openai"`, `"commandcode"`).
- `PROVIDER_ENV_MAP` in `packages/shared/src/constants/providers.ts` maps provider IDs to env var names — but this map is independently maintained from the adapter registration in provider-service.ts. They can and have drifted (e.g., adapter ID `"commandcode"` vs old map key `"cohere"`). Always update both when adding/changing a provider.

## TypeScript version

- All packages use `"typescript": "catalog:"` → `^6.0.3` via pnpm catalog. Root also uses catalog. Resolution differences between `tsx` and `tsc` may still occur but the version gap is gone.

## `skill` tool

- The server registers a `skill` tool that lets the LLM dynamically load skill instructions mid-conversation. Tool `name` parameter is constrained to an `enum` of valid skill names.

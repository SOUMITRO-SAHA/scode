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
│   │   │   ├── daemon.ts      # Server lifecycle (health check, spawn, poll, stop)
│   │   │   └── client.ts      # HTTP fetch client with streaming via ReadableStream.getReader()
│   │   ├── package.json       # @scode/cli — deps: @opentui/core, @opentui/react, react
│   │   └── tsconfig.json      # JSX with @opentui/react
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

# Key Design Decisions

- **CLI is client-only** — no AI logic in CLI. Thin client that forwards prompts to server and streams responses.
- **Singleton server** — one process serves all CLI invocations. Server holds API keys, model connections, and skill cache.
- **Auto lifecycle** — CLI spawns server if not running; server stays alive until idle timeout or explicit shutdown.
- **Transport**: HTTP/TCP with JSON health checks, streaming via Hono's `stream()` (chunked transfer).
- **Skills location**: `.agents/skills/` (plural).
- **Tool loop**: Single-turn prompt → Claude calls tools → server executes → feeds results back. Max 10 iterations.
- **Model**: `claude-sonnet-4-20250515` via Anthropic SDK, streaming with `tool_use` support.

# Testing

- `pnpm demo` — end-to-end: CLI spawns server, sends prompt, streams response (needs ANTHROPIC_API_KEY)
- Both `--prompt` (stdout) and interactive TUI modes
- `pnpm check-types` — type check both packages

# Skill Matching

- Simple keyword-based: tokenizes prompt and skill metadata, counts keyword overlap
- Returns matched skills + always includes `main` fallback skill
- "What's the weather?" → no skills matched → only `main` fallback (correct behavior)

# Non-obvious Project Facts

## Package conventions
- `@scode/shared` uses subpath exports (`"./logger"`, `"./constants"`) — no root `"."` export. Import as `@scode/shared/logger`, not `@scode/shared`.
- `@scode/theme` uses single root export (`"."`). Zero runtime dependencies.
- Neither `@scode/shared` nor `@scode/theme` have tsconfig paths or project references — resolution relies entirely on pnpm workspace + bundler (tsx).

## Stale turbo.json
- `turbo.json` `build.outputs` lists `.next/**` — there is NO Next.js app in this repo. Config was copied from another project.
- `turbo.json` has `lint` and `check-types` tasks but most packages lack lint scripts.

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

## Two separate skill systems
- `.agents/skills/` = runtime skills for the scode AI agent (welcome-me, changelog, documentation).
- `.opencode/skills/` = development skills for the AI coding agent building scode (opencode, opentui, effect, toon).
- Server only reads `.agents/skills/`. The `.opencode/` skills are never loaded at runtime.

## Disconnected web app
- `apps/web/` is a standalone Vite+React scaffold with zero internal monorepo dependencies. NOT integrated with the scode server. Uses React Compiler for auto-memoization.

# Server Non-obvious Learnings

## tsconfig quirks

- `jsx: "react-jsx"` and `jsxImportSource: "hono/jsx"` are enabled despite zero `.tsx` files in the server — leftover from template or prep for future Hono JSX views.
- No tsconfig `paths` or `references` — `@scode/shared/logger` and `@scode/shared/constants` resolve via pnpm workspace linking only.

## Skill system

- Two separate skill directories exist: `.agents/skills/` (scode agent runtime skills) and `.opencode/skills/` (AI coding agent context). Server only reads `.agents/skills/`.
- `discover.ts` resolves `.agents/skills/` relative to `import.meta.dirname`, not CWD — must be same structural layout at runtime.
- Prompt builder system prompt + MAIN_SKILL body both start with "You are scode..." — slightly different wording, both end up in context (redundant).

## API key validation

- `claude/client.ts` throws if ANTHROPIC_API_KEY is the literal placeholder `"sk-ant-..."` from `.env.example`. Single env var; no .env.local or per-environment files.

## Dependencies

- Server depends on `@scode/shared` (pino logging, constants) but NOT on `@scode/theme` (no UI).
- Core deps: hono, @hono/node-server, @anthropic-ai/sdk, yaml.

## CommandCode adapter

- `CommandCodeAdapter` in `llm/commandcode/adapter.ts` uses raw `fetch()` to call `api.commandcode.ai` with an OpenAI-compatible API format. No SDK dependency needed.

## Testing (TDD)

- **What's tested:** registry (5 tests), matcher (5 tests), active-clients (8 tests), prompt-builder (2 tests), types (2 tests) — all 100% line coverage.
- **What's not tested:** LLM adapter (`claude/client.ts` — needs Anthropic SDK mock), tool executors (`read.ts`, `write.ts`, `edit.ts`, `bash.ts`, `grep.ts`, `glob.ts` — heavy filesystem I/O), server entrypoint (`index.ts` — Hono routing), skill loader (`loader.ts` — filesystem reads).
- **Mocking patterns:**
  - `vi.mock("@anthropic-ai/sdk")` for LLM client tests (not yet written).
  - Tool executors can be tested by creating temp files via `node:fs` + `beforeEach`/`afterEach` cleanup.
  - Pure functions (matcher, prompt-builder, types) need zero mocking.
- Tests use `vitest` with `environment: "node"` — no DOM dependencies.

## Tool security

- All file tools (read, write, edit) validate path safety — prevents workspace escape.
- bash tool uses `execSync` with 10MB max buffer and configurable timeout.

## Route redundancy

- `/process` (legacy root mount at `POST /process` in `index.ts`) and `/api/v1/chat`, `/api/v1/process` in the v1 router all share the same `chatStream` handler function. Three routes, identical behavior.

## Effect language service plugin

- `tsconfig.json` includes `@effect/language-service` plugin with `namespaceImportPackages: ["effect", "@effect/platform-node"]`. Server doesn't use Effect directly in its own code — this only matters if an LLM adapter's type declarations reference Effect types.

## Dev mode

- Server uses `tsx watch src/index.ts` for dev (no native FFI). Unlike CLI, there's no bun-based watcher workaround needed.

## Effect v4 API instability (type-only)

- `Cause.isFailType` and `Cause.error` at `apps/server/src/chat/handler.ts:82-83` don't exist on the Effect v4 beta `Cause` type — these produce `tsc --noEmit` errors but work at runtime via `tsx`. See also the root AGENTS.md `tsc vs tsx duality` section.
- Server imports `Cause` from `"effect"` namespace import but only uses it in one handler function. If Effect's β API surface changes again, this is the only site to patch.

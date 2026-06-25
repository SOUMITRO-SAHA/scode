# CLI Non-obvious Learnings

## Import quirks
- `@scode/shared/logger` and `@scode/shared/constants` have no tsconfig paths or project references — resolution relies on pnpm workspace + tsx bundler only.
- `verbatimModuleSyntax: true` in tsconfig — all relative imports must include `.js` extension despite being TS source.

## OpenTUI
- `@opentui/core-darwin-arm64` is a required native binary for Apple Silicon. On other platforms a different platform binary is needed.
- `jsxImportSource: "@opentui/react"` in tsconfig — not standard React JSX.

## Debug panel (ThinkingPanel.tsx)
- Skill names in debug mode are **hardcoded** (`welcome-me`, `documentation`), not dynamically loaded from `.agents/skills/`. Won't reflect actual discovered skills.

## Server lifecycle
- Daemon spawns server via `npx tsx apps/server/src/index.ts` — no port is passed explicitly; relies on DEFAULT_PORT (4100) from server's own arg parsing.
- CLI uses `fileURLToPath(import.meta.url)` to resolve server entry relative to its own `__dirname`.

## Entrypoint
- `pnpm cli` at root tries `bun` first (silent failure), falls back to `tsx` — bun is faster for dev startup.
- Three modes: `--prompt` (single-shot stdout), TUI (interactive), REPL fallback if TUI fails.

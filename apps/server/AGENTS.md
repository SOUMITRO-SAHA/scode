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

## Tool security

- All file tools (read, write, edit) validate path safety — prevents workspace escape.
- bash tool uses `execSync` with 10MB max buffer and configurable timeout.

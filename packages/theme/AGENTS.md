# Theme Non-obvious Learnings

## Package design
- Pure leaf package — zero runtime dependencies. Depends only on devDeps (tsx, typescript).
- Single root export `"."` → `./src/index.ts` (contrast with `shared` package's named subpath exports).
- TypeScript 6.x while consuming apps (CLI, server) use TS 5.x — potential type-check divergence.

## Token structure
- `tokens.ts` exports individual sections (background, border, text, brand, etc.) AND a merged `theme` object (spread of all sections + status).
- Status colors (success, warning, error, info) are computed once as a merged Spread — not individually importable.
- `syntax` colors live in `colors.ts`, not tokens — consumed directly by CLI's `syntaxTheme.ts`.

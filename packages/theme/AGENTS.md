# Theme Non-obvious Learnings

## Package design

- Pure leaf package — zero runtime dependencies. Depends only on devDeps (tsx, typescript).
- Single root export `"."` → `./src/index.ts` (contrast with `shared` package's named subpath exports).
- TypeScript 6.x while consuming apps (CLI, server) use TS 5.x — potential type-check divergence.
- Exports design tokens AND layout configuration — usable in both CLI (OpenTUI flexbox) and web (CSS) contexts.

## Token structure

- `tokens.ts` exports individual sections (background, border, text, brand, etc.) AND a merged `theme` object (spread of all sections + status).
- Status colors (success, warning, error, info) are computed once as a merged Spread — not individually importable.
- `syntax` colors live in `colors.ts`, not tokens — consumed directly by CLI's `syntaxTheme.ts`.

## Testing (TDD)

- **100% line/branch/function coverage** — every export is exercised.
- Layout utilities (`getBreakpoint`, `isWide`, `getComposerLines`) are tested with boundary and edge-case values.
- Data-only modules (tokens, colors, typography, spacing) have a single smoke test that imports all exports — this verifies no runtime errors in the deeply-merged token object.
- No mocking needed — zero runtime deps means pure function tests only.

## Layout tokens (`layout.ts`)

- `breakpoints` — terminal width thresholds (`sm: 80`, `md: 100`, `lg: 120` columns). Used for responsive layout switching in CLI.
- `sidebar.width` — fixed sidebar width (30 columns). Single source of truth for both CLI sidebar and future web sidebar.
- `content.maxWidth` / `content.minWidth` — content area constraints. `promptMaxWidth` for the composer/input.
- `composer.linesByHeight` — number of composer lines per height tier (compact/normal/spacious).
- Utility functions: `getBreakpoint(width)` returns `"sm" | "md" | "lg"`, `isWide(width)` returns boolean for ≥120 cols, `getComposerLines(height)` returns line count.
- Platform-agnostic: same values can drive Yoga flexbox props (CLI) or CSS media queries + container queries (web).

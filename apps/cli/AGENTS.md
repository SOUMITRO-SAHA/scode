# CLI Non-obvious Learnings

## Import quirks
- `@scode/shared/logger` and `@scode/shared/constants` have no tsconfig paths or project references — resolution relies on pnpm workspace + tsx bundler only.
- `verbatimModuleSyntax: true` in tsconfig — all relative imports must include `.js` extension despite being TS source.

## OpenTUI
- `@opentui/core-darwin-arm64` is a required native binary for Apple Silicon. On other platforms a different platform binary is needed.
- `jsxImportSource: "@opentui/react"` in tsconfig — not standard React JSX.
- This project uses **React bindings only** (`@opentui/react`). Never use Solid.js bindings.
- Components use OpenTUI primitives (`<box>`, `<text>`, `<scrollbox>`, `<textarea>`, `<input>`, `<markdown>`, `<ascii-font>`) with JSX — no custom renderers.

## Theming — Strict policy
- **All** styling goes through `@scode/theme`. Never use raw color strings, local constants, or per-component style objects.
- Import pattern: `import { theme } from "@scode/theme"` — then use `theme.background.*`, `theme.text.*`, `theme.border.*`, `theme.brand.*`, `theme.markdown.*`, `theme.chat.*`, `theme.input.*`, `theme.terminal.*`, `theme.success`, `theme.warning`, `theme.danger`, `theme.info`, `theme.opacity.*`.
- The only exception is `syntaxTheme.ts` which translates `@scode/theme`'s `colors` into `SyntaxStyle` configs for OpenTUI's `<markdown>` component. This is acceptable because OpenTUI requires a `SyntaxStyle` object, not theme tokens directly.
- If you need a new token (e.g. a color for a new component variant), add it to `packages/theme/src/tokens.ts` (or `colors.ts` for new base colors). Never define scoped or local theme values in the CLI package.
- Rationale: single source of truth for visual identity. No drift between components, no duplicated hex values.

## Debug panel (ThinkingPanel.tsx)
- Skill names in debug mode are **hardcoded** (`welcome-me`, `documentation`), not dynamically loaded from `.agents/skills/`. Won't reflect actual discovered skills.

## Server lifecycle
- Daemon spawns server via `npx tsx apps/server/src/index.ts` — no port is passed explicitly; relies on DEFAULT_PORT (4100) from server's own arg parsing.
- CLI uses `fileURLToPath(import.meta.url)` to resolve server entry relative to its own `__dirname`.

## Responsive TUI Patterns

### Terminal resize handling
- `useTerminalDimensions()` (from `@opentui/react`) provides reactive `{width, height}` — the primary mechanism for responsive layouts. Every re-render triggered by SIGWINCH is debounced at 100ms by default in OpenTUI core.
- Layout breakpoints (from `@scode/theme`'s `layout.breakpoints`): `sm=80`, `md=100`, `lg=120` columns. Use `getBreakpoint(width)` or `isWide(width)` helpers.
- The root `<box>` must always be `<box width={width} height={height} flexDirection="row">` — the width/height anchor the Yoga layout tree to terminal dimensions.

### Flexbox layout strategy
- Use `flexGrow` for expansible areas, fixed heights for headers/footers: `Header (1) → ChatArea (grow) → Composer (auto) → Footer (1)`.
- Use `width` percentages for proportional splits (e.g. sidebar `width="30%"` or fixed width from `theme.layout.sidebar.width`).
- Use `minHeight={0}` on flex-grow containers to prevent overflow issues.
- Use `overflow="hidden"` or `<scrollbox>` for content that exceeds available space.

### Responsive sidebar pattern (from opencode)
- When terminal width ≥120 (breakpoint `lg`), sidebar renders inline using normal flex flow.
- When narrower, sidebar should use absolute position overlay with backdrop (semi-transparent background) when toggled open. This prevents content squeeze on small terminals.
- Sidebar width sourced from `theme.layout.sidebar.width` (30 columns).

### Content width calculation
- Available content width = `terminalWidth - (sidebarVisible ? sidebarWidth : 0) - padding`.
- Prompt/composer max width capped at `theme.layout.content.promptMaxWidth`.
- Use `Math.min(availableWidth, maxWidth)` to prevent excessive line lengths on wide terminals.

### Composer lines by terminal height
- Use `getComposerLines(height)` from `@scode/theme`:
  - `< 20 rows` → 1 line (compact)
  - `< 28 rows` → 2 lines (normal)
  - `≥ 28 rows` → 3 lines (spacious)
- This is already implemented; ensure any new height-sensitive component follows the same pattern.

### Performance patterns
- **Memoize static style objects** with `useMemo` or hoist to module level — avoids re-creating `SyntaxStyle` on every render.
- **ScrollBox with `stickyScroll` + `stickyStart="bottom"`** — keeps scroll anchored to bottom during streaming.
- **Viewport culling** — OpenTUI's `ScrollBox` natively skips rendering off-screen children. Utilize this for long message lists.
- **Avoid prop drilling width/height** — use `useTerminalDimensions()` directly in the consuming component where needed.
- **Conditional rendering** — hide components entirely when not needed (e.g. sidebar, modals) rather than using opacity/visibility.

### Web vs CLI context
- `@scode/theme/layout` exports platform-agnostic tokens. In CLI they drive Yoga flexbox props; in the future web app they could drive CSS container queries or Tailwind breakpoints.
- When adding a new layout-sensitive component, prefer deriving its dimensions from `theme.layout` rather than hardcoding numbers.

## Entrypoint
- `pnpm cli` at root tries `bun` first (silent failure), falls back to `tsx` — bun is faster for dev startup.
- Three modes: `--prompt` (single-shot stdout), TUI (interactive), REPL fallback if TUI fails.

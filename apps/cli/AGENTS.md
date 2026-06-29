# CLI Non-obvious Learnings

## Import quirks

- `@scode/shared/logger`, `@scode/shared/constants`, `@scode/shared/utils` have no tsconfig paths or project references — resolution relies on pnpm workspace + tsx bundler only.
- **No `.js` extensions in imports.** Never import with `.js` suffix — tsx resolves extensionless imports natively. Use `from "./foo"` not `from "./foo.js"`.

## OpenTUI

- `@opentui/core-darwin-arm64` is a required native binary for Apple Silicon. On other platforms a different platform binary is needed.
- `jsxImportSource: "@opentui/react"` in tsconfig — not standard React JSX.
- This project uses **React bindings only** (`@opentui/react`). Never use Solid.js bindings.
- Components use OpenTUI primitives (`<box>`, `<text>`, `<scrollbox>`, `<textarea>`, `<input>`, `<markdown>`, `<ascii-font>`) with JSX — no custom renderers.
- OpenTUI's native FFI only works under bun (not Node/tsx) because it uses Bun's FFI bindings under the hood. `pnpm dev` must run via bun; headless modes that skip TUI (REPL, `--prompt`) can use tsx.

## Theming — Strict policy

- **All** styling goes through `@scode/theme`. Never use raw color strings, local constants, or per-component style objects.
- Import pattern: `import { theme } from "@scode/theme"` — then use `theme.background.*`, `theme.text.*`, `theme.border.*`, `theme.brand.*`, `theme.markdown.*`, `theme.chat.*`, `theme.input.*`, `theme.terminal.*`, `theme.success`, `theme.warning`, `theme.danger`, `theme.info`, `theme.opacity.*`.
- The only exception is `syntaxTheme.ts` which translates `@scode/theme`'s `colors` into `SyntaxStyle` configs for OpenTUI's `<markdown>` component. This is acceptable because OpenTUI requires a `SyntaxStyle` object, not theme tokens directly.
- If you need a new token (e.g. a color for a new component variant), add it to `packages/theme/src/tokens.ts` (or `colors.ts` for new base colors). Never define scoped or local theme values in the CLI package.
- Rationale: single source of truth for visual identity. No drift between components, no duplicated hex values.

## Debug panel (ThinkingPanel.tsx)

- Skill names in debug mode are **hardcoded** (`welcome-me`, `documentation`), not dynamically loaded from `.agents/skills/`. Won't reflect actual discovered skills.

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

- `@scode/theme` (root export, `import { layout } from "@scode/theme"`) exports platform-agnostic layout tokens. There is no `@scode/theme/layout` subpath export. In CLI they drive Yoga flexbox props; in the future web app they could drive CSS container queries or Tailwind breakpoints.
- When adding a new layout-sensitive component, prefer deriving its dimensions from `theme.layout` rather than hardcoding numbers.

## Testing (TDD)

- **What's tested:** store (19 tests), shutdown (7 tests), types (2 tests) — all 100% line coverage.
- **What's not tested:** `app.tsx`, `header.tsx`, `chat-area.tsx`, `composer.tsx`, `thinking-panel.tsx`, `footer.tsx` — OpenTUI components need a jsdom-like TUI environment not yet configured.
- **Mocking patterns:**
  - `vi.mock("@scode/shared/utils")` — blanket mocks `apiFetch`, `apiFetchStream`, `generateId` for service tests.
  - `vi.mock("node:child_process")` — for daemon tests (not yet written).
  - `vi.spyOn(process, "exit")` — for shutdown handler tests.
- **Store tests:** Create fresh `useStore` instances per test via `useStore.setState(initial)`, verify state transitions directly.
- Test files in `src/__tests__/` are excluded from tsconfig.

## Entrypoint

- `pnpm cli` at root tries `bun` first (silent failure), falls back to `tsx` — bun is faster for dev startup. `--prompt` args only reach the tsx fallback (not bun), which is intentional — TUI mode doesn't need them, and `pnpm exec tsx ... --prompt` is available for headless single-shot mode.
- Actually: `--prompt` with bun fails because pnpm appends args after the `||` expression. `scripts/cli.sh` fixes this by inspecting `$@` for `--prompt` and routing to `tsx` directly. Without `--prompt`, it still uses bun for TUI.
- Three modes: `--prompt` (single-shot stdout), TUI (interactive), REPL fallback if TUI fails.
- `runHeadless` handles `--repl` mode and **returns `true`** — all `--repl` handling (including log suppression) must happen inside `runHeadless`, not in `index.tsx` after the call. Code after `runHeadless` for `--repl` is dead code.

## Server lifecycle

- Daemon spawns server via `npx tsx apps/server/src/index.ts` — no port is passed explicitly; relies on DEFAULT_PORT (4100) from server's own arg parsing.
- CLI uses `fileURLToPath(import.meta.url)` to resolve server entry relative to its own `__dirname`.
- The `[server]`-prefixed logs seen in TUI come from `daemon.ts`'s `child.stdout.on("data")` and `child.stderr.on("data")` handlers piping the child process's output — not from the daemon's own logger. To suppress server logs, check an env var (`SCODE_LOG_LEVEL`) in `daemon.ts` before forwarding, not in the server process itself.

## Stream cleanup asymmetry

- `client.ts` (used in `--prompt` mode) properly destroys the stream in a `finally` block: `(stream as Readable).destroy()`.
- `useStreamChat.ts` (used in TUI mode) **does not** destroy the stream — its `finally` block only resets state and invalidates queries. If the read loop breaks on exception, the stream is orphaned.

## OpenTUI TextArea content access

- The canonical way to get a `TextArea`'s content is `ref.current.plainText`. After removing `any` casts, the fallback chain was simplified from `ta?.plainText ?? ta?.value ?? ""` to `ta?.plainText ?? ""` — `ta?.value` was dead code (OpenTUI's `TextArea` exposes content exclusively through `plainText`).

## Dialog scroll behavior

- OpenTUI's `ScrollBox` does not auto-scroll to focused/selected children. The `DialogSelect` component tracks `selectedIndex` and manually calls `.scrollIntoView()` on option element refs when selection changes. Without this, the selected item scrolls out of view.

## Store access pattern

- `useAppStore.getState()` is used to read Zustand state outside React render cycle (e.g., in `useStreamChat` event handlers, `setTimeout` callbacks, and imperative code). This avoids `useStore()` hook dependency constraints in non-component contexts.

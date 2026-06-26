# Web Non-obvious Learnings

## Status

- This is a **disconnected Vite+React scaffold** — NOT integrated with the scode server.
- README says: `[TODO] | Web UI for SCode` — placeholder for future work.

## Tech stack

- Vite 8.x with `@vitejs/plugin-react` and `@rolldown/plugin-babel` (not Hono SSR).
- Uses React Compiler (`babel-plugin-react-compiler`) for auto-memoization.
- TypeScript ~6.0.2 — diverges from workspace (root: 5.9.2, CLI/server: 5.8.x).

## Dependencies

- Zero internal monorepo dependencies — does NOT depend on `@scode/theme`, `shared`, or any local packages.
- Only external deps: react 19, react-dom 19, with dev tooling (vite, eslint, typescript).

## Test/workspace exclusion

- **Excluded from `vitest.workspace.ts`** — not part of the 4-package test suite. No `test` script, no vitest config.
- Not in turbo's effective scope: `build` task outputs glob (`.next/**`) doesn't match web output.

## Build tooling

- **Vite 8.x** with `@rolldown/plugin-babel` — very new, uses Rolldown (Rust-based bundler) instead of esbuild.
- Only package that uses `tsc -b` (TypeScript project references build mode) for type checking.

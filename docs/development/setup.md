# Development Setup

## Prerequisites

- Node.js >= 18
- pnpm >= 9.0
- bun >= 1.3.14 (required for TUI — OpenTUI FFI only works under bun)

## Getting Started

```bash
git clone <repo-url>
cd scode
pnpm install

# Verify setup
pnpm check-types
pnpm test
```

## Development Commands

```bash
# TUI mode (debug logs, bun required)
pnpm dev

# REPL mode (no TUI, clean output, uses tsx)
pnpm dev:headless

# CLI dev with file watching
pnpm dev:cli           # Uses bun (tsx watch crashes OpenTUI FFI)

# Server dev with file watching
pnpm dev:server        # Uses tsx watch

# Quick demo (headless single-shot)
pnpm demo

# Web dev
pnpm dev:web
```

## Debug Mode

`pnpm dev` runs with `SCODE_DEBUG=1` automatically. To debug the production CLI:

```bash
SCODE_DEBUG=1 pnpm cli
```

## Monorepo Structure

scode is a pnpm workspace monorepo with Turborepo for task orchestration:

```
pnpm-workspace.yaml    # Workspace definition
turbo.json             # Turborepo pipeline config
vitest.workspace.ts    # Vitest workspace (4 packages)
```

### Package Locations

| Package         | Path               | Purpose                    |
| --------------- | ------------------ | -------------------------- |
| `@scode/cli`    | `apps/cli/`        | Terminal client            |
| `@scode/server` | `apps/server/`     | Backend server             |
| `@scode/shared` | `packages/shared/` | Shared types and utilities |
| `@scode/theme`  | `packages/theme/`  | Design tokens              |
| `web`           | `apps/web/`        | Experimental web app       |

## Code Style

- **Formatter**: Prettier (80 chars, 2 spaces, trailing commas, import sorting)
- **TypeScript**: ^6.0.3 via pnpm catalog
- **Linting**: Via turbo pipeline
- **Pre-commit hooks**: Husky + lint-staged

## Tools & Frameworks

| Tool        | Purpose                                |
| ----------- | -------------------------------------- |
| OpenTUI     | Terminal UI framework (React bindings) |
| Effect v4   | Effect system for TypeScript           |
| Hono        | HTTP server framework                  |
| Drizzle ORM | SQLite ORM                             |
| Vitest      | Testing framework                      |
| Turborepo   | Monorepo orchestration                 |

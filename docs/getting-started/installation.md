# Installation

## System Requirements

| Requirement | Minimum                      |
| ----------- | ---------------------------- |
| bun         | >= 1.3.14 (required for TUI) |
| Node.js     | >= 18                        |
| pnpm        | >= 9.0                       |
| OS          | macOS, Linux, Windows        |

> **bun is required for TUI mode** — OpenTUI's native FFI bindings only work under bun. Use `pnpm dev:headless` for bun-free headless mode.

## Setup Steps

### 1. Install Dependencies

```bash
pnpm install
```

Installs all workspace packages:

- `@scode/cli` — the terminal client
- `@scode/server` — the backend server
- `@scode/shared` — shared types and utilities
- `@scode/theme` — design tokens

### 2. Build Native Binaries

OpenTUI requires platform-specific native binaries. These are installed automatically:

- `@opentui/core-darwin-arm64` — Apple Silicon
- `@opentui/core-darwin-x64` — Intel macOS
- `@opentui/core-linux-x64` — Linux
- `@opentui/core-win32-x64` — Windows

### 3. Verify Installation

```bash
pnpm check-types
pnpm test
```

## Next Steps

- [Quick Start](quick-start.md) — choose TUI or headless flow
- [Configuration Guide](configuration.md) — API keys, auth file

## Project Structure

```
scode/
├── apps/
│   ├── cli/          # Terminal UI client
│   ├── server/       # Backend server
│   └── web/          # Standalone web app (experimental)
├── packages/
│   ├── shared/       # Shared types, utils, constants
│   └── theme/        # Design tokens
├── .agents/
│   └── skills/       # Built-in AI skills
└── docs/             # Documentation
```

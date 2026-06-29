# Installation

## System Requirements

| Requirement | Minimum                        |
| ----------- | ------------------------------ |
| Node.js     | >= 18                          |
| pnpm        | >= 9.0                         |
| bun         | >= 1.3.14 (optional, dev only) |
| OS          | macOS, Linux, Windows          |

## Setup Steps

### 1. Install Dependencies

```bash
pnpm install
```

This installs all workspace dependencies including:

- `@scode/cli` — the terminal client
- `@scode/server` — the backend server
- `@scode/shared` — shared types and utilities
- `@scode/theme` — design tokens

### 2. Build Native Binaries

OpenTUI requires platform-specific native binaries. These are installed automatically for the following platforms:

- `@opentui/core-darwin-arm64` — Apple Silicon
- `@opentui/core-darwin-x64` — Intel macOS
- `@opentui/core-linux-x64` — Linux
- `@opentui/core-win32-x64` — Windows

### 3. Verify Installation

```bash
pnpm check-types
pnpm test
```

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

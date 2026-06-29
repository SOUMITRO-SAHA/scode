# scode

**scode** — a mini coding agent CLI for software engineering tasks. Built with a **client-server** architecture: a thin OpenTUI+React TUI client forwards prompts to a singleton server that handles skill discovery, prompt building, LLM integration (Claude, Gemini, OpenAI-compatible, CommandCode), and tool execution.

Developed by [SOUMITRA SAHA](mailto:soumitrosahaofficial@gmail.com).

## Requirements

| Tool    | Version   | Needed For                                  |
| ------- | --------- | ------------------------------------------- |
| **bun** | >= 1.3.14 | TUI mode (OpenTUI FFI only works under bun) |
| Node.js | >= 18     | All modes                                   |
| pnpm    | >= 9.0    | All modes                                   |

## Quick Start (Recommended: TUI)

```bash
# 1. Install dependencies
pnpm install

# 2. Launch the terminal UI
pnpm dev
```

Inside the TUI, use the `/connect` command or provider switcher to add your API key — no upfront env var setup needed.

## Alternative: Headless Mode (No bun required)

```bash
# 1. Install dependencies
pnpm install

# 2. Set an API key (required — no TUI to configure it)
export ANTHROPIC_API_KEY=sk-ant-...

# 3. REPL or single-shot
pnpm dev:headless
```

## Commands

| Command             | Mode                        | Runtime |
| ------------------- | --------------------------- | ------- |
| `pnpm dev`          | TUI (debug, recommended)    | bun     |
| `pnpm cli`          | TUI (bun → tsx fallback)    | bun/tsx |
| `pnpm dev:headless` | REPL (no TUI, clean output) | tsx     |
| `pnpm demo`         | Single-shot demo            | tsx     |
| `pnpm cli --prompt` | Single-shot                 | tsx     |
| `pnpm server`       | Standalone server           | tsx     |
| `pnpm dev:cli`      | CLI dev with file watching  | bun     |
| `pnpm dev:server`   | Server dev with tsx watch   | tsx     |
| `pnpm test`         | Run all tests               | vitest  |
| `pnpm check-types`  | Type-check all packages     | tsc     |
| `pnpm format`       | Format with Prettier        | —       |

## Documentation

Full docs in [`docs/`](docs/index.md):

| Section                                                | Description                                    |
| ------------------------------------------------------ | ---------------------------------------------- |
| [Getting Started](docs/getting-started/quick-start.md) | Installation, configuration, API keys          |
| [CLI Guide](docs/cli/overview.md)                      | TUI mode, headless mode, commands, keybindings |
| [Server Guide](docs/server/overview.md)                | Architecture, API reference, providers         |
| [Architecture](docs/architecture/overview.md)          | System design, client-server model, data flow  |
| [Skills](docs/skills/overview.md)                      | Skill system, creating skills, built-in skills |
| [Development Setup](docs/development/setup.md)         | Local dev environment, commands                |
| [Contributing Guide](docs/development/contributing.md) | Workflow, conventions, PR guidelines           |
| [Testing](docs/development/testing.md)                 | TDD, coverage, mocking patterns                |

## Architecture

```
┌────────────────┐      HTTP/TCP        ┌───────────────────────────────────────────────────────────┐
│  CLI (OpenTUI) │ ───────────────────→ │  Server (Hono, singleton)                                 │
│  Thin client   │ ←── stream ───────── │  • Skill discovery & matching                             │
└────────────────┘                      │  • Prompt building                                        │
                                        │  • LLM (Claude/Gemini/DeepSeek/Z.ai/MiniMax/CommandCode)  │
                                        │  • Tool execution (read, write, bash, ...)                │
                                        │  • SQLite via Drizzle ORM                                 │
                                        └───────────────────────────────────────────────────────────┘
```

## Project Structure

```
scode/
├── apps/
│   ├── cli/          # CLI client — OpenTUI+React TUI, server lifecycle
│   ├── server/       # Server — Hono HTTP API, skill system, LLM, tools, DB
│   └── web/          # Standalone Vite+React scaffold (not integrated)
├── packages/
│   ├── shared/       # Shared types, utils, logger, constants
│   └── theme/        # Design tokens, colors, typography, layout tokens
├── .agents/skills/   # Runtime skills (welcome-me, changelog, documentation)
├── scripts/
│   └── cli.sh        # CLI wrapper — routes --prompt to tsx, else tries bun
├── docs/             # Full documentation
└── .env.example      # API key configuration reference
```

## How It Works

1. CLI checks if server is running on port 4100; spawns one if not
2. Server **discovers** skills from `.agents/skills/`
3. Server **matches** user prompt to relevant skills (keyword overlap)
4. Server **loads** matched SKILL.md files (YAML frontmatter + body)
5. Server **builds** a system prompt with skill context + tool definitions
6. Server calls **LLM** (Claude / Gemini / DeepSeek / Z.ai / MiniMax / CommandCode / OpenAI) with tools
7. LLM may call tools → server executes → feeds results back (up to 10 rounds)
8. Final response **streams** back to CLI via chunked transfer

## Tools

| Tool    | Description                         |
| ------- | ----------------------------------- |
| `read`  | Read files or list directories      |
| `write` | Create/overwrite files              |
| `edit`  | Exact string replacement            |
| `bash`  | Execute shell commands              |
| `grep`  | Regex content search                |
| `glob`  | Glob pattern file search            |
| `skill` | Dynamically load skill instructions |

## Skills

Skills are stored in `.agents/skills/<name>/SKILL.md` with YAML frontmatter. See the [Skills documentation](docs/skills/overview.md) for details.

- **welcome-me** — Greet new users and orient them
- **changelog** — Generate changelogs from git history
- **documentation** — Generate/update project docs

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide, or check the development docs:

- [Development Setup](docs/development/setup.md) — local dev environment
- [Contributing Guide](docs/development/contributing.md) — workflow, conventions, PRs
- [Testing](docs/development/testing.md) — TDD, coverage, mocking

Key points:

- **TDD** — write tests first, then implement
- **Conventional commits** — `feat:`, `fix:`, `docs:`, etc.
- **Pre-commit hooks** — formatting enforced via Husky
- **TypeScript** — strict mode, ^6.0.3 across all packages

## License

MIT &copy; 2026 SOUMITRA SAHA

# scode

**scode** — a mini coding agent CLI for software engineering tasks. Built with a **client-server** architecture: a thin OpenTUI+React TUI client forwards prompts to a singleton server that handles skill discovery, prompt building, LLM integration (Claude, Gemini, OpenAI-compatible, CommandCode), and tool execution.

Developed by [SOUMITRA SAHA](mailto:soumitrosahaofficial@gmail.com).

## System Requirements (READ THIS FIRST)

| Tool    | Version   | Required?                                                                   |
| ------- | --------- | --------------------------------------------------------------------------- |
| **bun** | >= 1.3.14 | **YES** — TUI mode requires OpenTUI's native FFI which only works under bun |
| Node.js | >= 18     | Yes                                                                         |
| pnpm    | >= 9.0    | Yes                                                                         |

> **bun is not optional.** The TUI (Terminal UI) relies on OpenTUI, whose native FFI bindings only work under bun. Without bun, `pnpm dev` and `pnpm cli` (for TUI) will fail. Use `pnpm dev:headless` as a fallback if bun is unavailable.

## Quick Start (Developer Setup)

```bash
# 1. Install dependencies
pnpm install

# 2. Set your API key (Anthropic, Gemini, etc.)
export ANTHROPIC_API_KEY=sk-ant-...

# 3. Interactive TUI mode (development, bun required)
pnpm dev

# 4. Or: REPL mode without TUI (no bun needed)
pnpm dev:headless

# 5. Single-shot mode (no bun needed)
pnpm dev:headless --prompt "Generate documentation for this project"
```

## Available Commands

| Command             | Description                                    | Runtime |
| ------------------- | ---------------------------------------------- | ------- |
| `pnpm dev`          | Interactive TUI with debug logs                | bun     |
| `pnpm cli`          | Interactive TUI (tries bun, falls back to tsx) | bun/tsx |
| `pnpm dev:headless` | REPL mode (no TUI, clean output)               | tsx     |
| `pnpm demo`         | Headless single-shot demo                      | tsx     |
| `pnpm cli --prompt` | Single-shot headless mode (outputs to stdout)  | tsx     |
| `pnpm server`       | Start server standalone on port 4100           | tsx     |
| `pnpm dev:cli`      | CLI dev with file watching                     | bun     |
| `pnpm dev:server`   | Server dev with `tsx watch`                    | tsx     |
| `pnpm test`         | Run all workspace tests                        | vitest  |
| `pnpm check-types`  | Type-check all packages                        | tsc     |
| `pnpm format`       | Format code with Prettier                      | —       |

## Documentation

Full documentation in [`docs/`](docs/index.md):

| Section                                                | Description                                    |
| ------------------------------------------------------ | ---------------------------------------------- |
| [Getting Started](docs/getting-started/quick-start.md) | Installation, configuration, API keys          |
| [CLI Guide](docs/cli/overview.md)                      | TUI mode, headless mode, commands, keybindings |
| [Server Guide](docs/server/overview.md)                | Architecture, API reference, providers         |
| [Architecture](docs/architecture/overview.md)          | System design, client-server model, data flow  |
| [Skills](docs/skills/overview.md)                      | Skill system, creating skills, built-in skills |
| [Development](docs/development/setup.md)               | Dev setup, testing, contributing               |

## Architecture

```
┌────────────────┐      HTTP/TCP        ┌───────────────────────────────────────────────────────────┐
│  CLI (OpenTUI) │ ───────────────────→ │  Server (Hono, singleton)                                 │
│  Thin client   │ ←── stream ───────── │  • Skill discovery & matching                             │
└────────────────┘                      │  • Prompt building                                        │
                                        │  • LLM (Claude/Gemini/DeepSeek/Z.ai/MiniMax/CommandCode)  │
                                        │  • Tool execution (read, write, bash, ...)                 │
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

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide, or check the [Development docs](docs/development/setup.md) for detailed setup and [Testing docs](docs/development/testing.md) for test conventions.

Key points:

- **TDD** — write tests first, then implement
- **Conventional commits** — `feat:`, `fix:`, `docs:`, etc.
- **Pre-commit hooks** — formatting enforced via Husky
- **TypeScript** — strict mode, ^6.0.3 across all packages

## License

MIT &copy; 2026 SOUMITRA SAHA

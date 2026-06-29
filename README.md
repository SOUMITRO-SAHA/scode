# scode

**scode** — a mini coding agent CLI for software engineering tasks. Built with a **client-server** architecture: a thin OpenTUI+React TUI client forwards prompts to a singleton server that handles skill discovery, prompt building, LLM integration (Claude, Gemini, OpenAI-compatible, CommandCode), and tool execution.

Developed by [SOUMITRA SAHA](mailto:soumitrosahaofficial@gmail.com).

## Quick Start

```bash
# Set your API key (Anthropic, Gemini, etc.)
export ANTHROPIC_API_KEY=sk-ant-...

# Interactive TUI mode
pnpm cli

# Single-shot mode (headless)
pnpm cli --prompt "Generate documentation for this project"

# Quick demo
pnpm demo
```

## Documentation

Full documentation is available in the [`docs/`](docs/index.md) directory:

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
├── docs/             # Full documentation
├── .env.example      # API key configuration reference
└── tasks/            # TODO and architecture plans
```

## Scripts

| Command                                                   | Description                                      |
| --------------------------------------------------------- | ------------------------------------------------ |
| `pnpm cli`                                                | Interactive TUI mode                             |
| `pnpm cli --prompt "..."`                                 | Single-shot headless mode (outputs to stdout)    |
| `pnpm cli --prompt "..." --model "gemini/gemini-2.5-pro"` | Headless with specific model                     |
| `pnpm server`                                             | Start server standalone on port 4100             |
| `pnpm web`                                                | Start web dev server                             |
| `pnpm demo`                                               | Quick demo: spawns server + sends test prompt    |
| `pnpm dev`                                                | Run CLI in debug mode (`SCODE_DEBUG=1 pnpm cli`) |
| `pnpm dev:cli`                                            | Dev mode for CLI with file watching              |
| `pnpm dev:server`                                         | Dev mode for server with `tsx watch`             |
| `pnpm test`                                               | Run all workspace tests                          |
| `pnpm check-types`                                        | Type-check all packages                          |
| `pnpm format`                                             | Format code with Prettier                        |

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

## Requirements

- Node.js >= 18
- pnpm 9
- **bun >= 1.3.14** (dev only — used by `pnpm cli` and `pnpm dev:cli` for fast startup; not required in production)
- At least one API key configured (Anthropic, Gemini, DeepSeek, Z.ai, MiniMax, OpenAI, or CommandCode)

## License

MIT &copy; 2026 SOUMITRA SAHA

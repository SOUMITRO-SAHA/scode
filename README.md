# scode

**scode** — a mini coding agent CLI for software engineering tasks. Built with a **client-server** architecture: a thin OpenTUI+React TUI client forwards prompts to a singleton server that handles skill discovery, prompt building, LLM integration (Claude, Gemini, OpenAI-compatible, CommandCode), and tool execution.

Developed by [SOUMITRA SAHA](mailto:soumitrosahaofficial@gmail.com).

## Quick Start

```bash
# Set your API key (Anthropic, Gemini, etc.)
export ANTHROPIC_API_KEY=sk-ant-...

# Run (spawns server automatically)
pnpm demo
pnpm cli --prompt "Generate documentation for this project"
```

## Architecture

```
┌────────────────┐      HTTP/TCP      ┌─────────────────────────────────────┐
│  CLI (OpenTUI) │ ──────────────────→ │  Server (Hono, singleton)           │
│  Thin client   │ ←── stream ────── │  • Skill discovery & matching       │
└────────────────┘                    │  • Prompt building                  │
                                      │  • LLM (Claude/Gemini/OpenAI/Cohere)│
                                      │  • Tool execution (read, write, …)  │
                                      │  • SQLite via Drizzle ORM           │
                                      └─────────────────────────────────────┘
```

## Project Structure

```
scode/
├── apps/
│   ├── cli/          # CLI client — OpenTUI+React TUI, server lifecycle
│   ├── server/       # Server — Hono HTTP API, skill system, LLM, tools, DB
│   └── web/          # Disconnected Vite+React scaffold (not integrated)
├── packages/
│   ├── shared/       # Shared types, utils, logger, constants
│   └── theme/        # Design tokens, colors, typography, layout tokens
├── .agents/skills/   # Runtime skills (welcome-me, changelog, documentation)
├── .env.example      # API key configuration reference
└── tasks/            # TODO and architecture plans
```

## Packages

| Package         | Description                                 |
| --------------- | ------------------------------------------- |
| `@scode/cli`    | Terminal client — OpenTUI, React, streaming |
| `@scode/server` | Backend server — Hono, LLM, skills, tools   |
| `@scode/shared` | Shared types, utils, logger, constants      |
| `@scode/theme`  | Design tokens — colors, typography, layout  |
| `web`           | Standalone Vite+React web scaffold          |

## Scripts

| Command                   | Description                              |
| ------------------------- | ---------------------------------------- |
| `pnpm cli --prompt "..."` | Single-shot mode (stdout)                |
| `pnpm cli`                | Interactive TUI mode                     |
| `pnpm server`             | Start server standalone                  |
| `pnpm web`                | Start web dev server                     |
| `pnpm demo`               | Quick demo: spawns server + sends prompt |
| `pnpm test`               | Run all workspace tests                  |
| `pnpm check-types`        | Type-check all packages                  |
| `pnpm format`             | Format code with Prettier                |

## How It Works

1. CLI checks if server is running on port 4100; spawns one if not
2. Server **discovers** skills from `.agents/skills/`
3. Server **matches** user prompt to relevant skills (keyword overlap)
4. Server **loads** matched SKILL.md files (YAML frontmatter + body)
5. Server **builds** a system prompt with skill context + tool definitions
6. Server calls **LLM** (Claude Sonnet / Gemini / OpenAI-compat / Cohere) with tools
7. LLM may call tools → server executes → feeds results back (up to 10 rounds)
8. Final response **streams** back to CLI via chunked transfer

## Tools

| Tool    | Description                    |
| ------- | ------------------------------ |
| `read`  | Read files or list directories |
| `write` | Create/overwrite files         |
| `edit`  | Exact string replacement       |
| `bash`  | Execute shell commands         |
| `grep`  | Regex content search           |
| `glob`  | Glob pattern file search       |

## Skills

Skills are stored in `.agents/skills/<name>/SKILL.md` with YAML frontmatter.

- **welcome-me** — Greet new users and orient them
- **changelog** — Generate changelogs from git history
- **documentation** — Generate/update project docs

## Requirements

- Node.js >= 18
- pnpm 9
- At least one API key configured (Anthropic, Gemini, OpenAI-compat, or Cohere)

## License

MIT &copy; 2026 SOUMITRA SAHA

# scode

A mini coding agent CLI that helps with software engineering tasks. Uses **client-server** architecture: a thin OpenTUI+React TUI client forwards prompts to a singleton server that handles skill discovery, prompt building, Claude Sonnet integration, and tool execution.

## Quick Start

```bash
# Set your Anthropic API key
export ANTHROPIC_API_KEY=sk-ant-...

# Run (spawns server automatically)
pnpm demo
pnpm cli --prompt "Generate documentation for this project"
```

## Architecture

```
┌────────────────┐      HTTP/TCP      ┌─────────────────────────────┐
│  CLI (OpenTUI) │ ──────────────────→ │  Server (Hono, singleton)   │
│  Thin client   │ ←── stream ────── │  • Skill discovery          │
└────────────────┘                    │  • Prompt building          │
                                      │  • Claude Sonnet (+ tools)  │
                                      │  • Tool execution           │
                                      └─────────────────────────────┘
```

## Project Structure

```
scode/
├── apps/
│   ├── cli/          # CLI client — OpenTUI+React TUI, server lifecycle
│   └── server/       # Server — Hono HTTP API, skill system, Claude integration, tools
├── packages/
│   ├── shared/       # Shared types and utilities (WIP)
│   └── utils/        # Utility functions (WIP)
├── .agents/skills/   # Skills loaded at runtime (welcome-me, changelog, etc.)
├── .env.example      # ANTHROPIC_API_KEY placeholder
└── tasks/            # TODO and architecture plan
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm cli --prompt "..."` | Single-shot mode (stdout) |
| `pnpm cli` | Interactive TUI mode |
| `pnpm server` | Start server standalone |
| `pnpm demo` | Quick demo: spawns server + sends prompt |
| `pnpm check-types` | Type-check both apps |

## How It Works

1. CLI checks if server is running on port 4100; spawns one if not
2. Server **discovers** skills from `.agents/skills/`
3. Server **matches** user prompt to relevant skills (keyword overlap)
4. Server **loads** matched SKILL.md files (YAML frontmatter + body)
5. Server **builds** a system prompt with skill context + tool definitions
6. Server calls **Claude Sonnet** with tools (read, write, edit, bash, grep, glob)
7. Claude may call tools → server executes → feeds results back (up to 10 rounds)
8. Final response **streams** back to CLI via chunked transfer

## Tools

| Tool | Description |
|------|-------------|
| `read` | Read files or list directories |
| `write` | Create/overwrite files |
| `edit` | Exact string replacement |
| `bash` | Execute shell commands |
| `grep` | Regex content search |
| `glob` | Glob pattern file search |

## Skills

Skills are stored in `.agents/skills/<name>/SKILL.md` with YAML frontmatter. Available skills:

- **welcome-me** — Greet new users and orient them
- **changelog** — Generate changelogs from git history
- **documentation** — Generate/update project docs

## Requirements

- Node.js >= 18
- pnpm 9
- ANTHROPIC_API_KEY environment variable

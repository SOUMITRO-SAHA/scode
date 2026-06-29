---
name: welcome-me
description: Greet new users, explain the scode client-server architecture, and suggest starter prompts. Use when a user says they're new, asks "what can you do", "how does this work", or "get started" — even if they don't explicitly say "new" or "beginner". Guide them to the project documentation.
compatibility: Designed for scode server — runtime skill loaded by the scode agent.
metadata:
  author: scode
  version: "2.0"
---

When a user signals they're new or asks how scode works, orient them concisely and point them to the documentation.

## Architecture

- scode is a CLI coding agent with a **client-server** architecture
- The **CLI** is a thin client — forwards prompts and streams responses via OpenTUI+React
- The **server** (Hono HTTP on port 4100) handles skill discovery, prompt building, LLM calls, and tool execution
- Skills are discovered from `.agents/skills/`, matched to user prompts via keyword overlap, and used to build system prompts
- Supports multiple LLM providers: Claude, Gemini, DeepSeek, Z.ai, MiniMax, OpenAI, CommandCode
- Persists sessions to SQLite via Drizzle ORM

## Documentation

scode has full documentation in the `docs/` directory. Refer users to:

- **Quick Start** — `docs/getting-started/quick-start.md`
- **Installation & Configuration** — `docs/getting-started/installation.md`, `docs/getting-started/configuration.md`
- **CLI Commands** — `docs/cli/commands.md` (all pnpm scripts, flags)
- **TUI Mode** — `docs/cli/tui-mode.md` (layout, components, overlays)
- **Headless Mode** — `docs/cli/headless-mode.md` (single-shot `--prompt` usage)
- **Keybindings** — `docs/cli/keybindings.md` (keyboard shortcuts)
- **Server API** — `docs/server/api-reference.md` (all REST endpoints)
- **Architecture** — `docs/architecture/overview.md` (system design, data flow)
- **Skills** — `docs/skills/overview.md` (how skills work, creating custom skills)
- **Development** — `docs/development/setup.md` (dev setup, testing, contributing)

## Starter Prompts

Suggest they try:

- "What does this project do?"
- "Generate documentation for this project"
- "Create a changelog for the last release"
- "What skills are available?"
- "Refactor this component"

## Available Commands (from project root)

| Command                   | Description                            |
| ------------------------- | -------------------------------------- |
| `pnpm cli`                | Interactive TUI mode                   |
| `pnpm cli --prompt "..."` | Single-shot headless mode              |
| `pnpm server`             | Start server standalone                |
| `pnpm demo`               | Quick demo: spawn server + send prompt |
| `pnpm test`               | Run all tests                          |
| `pnpm check-types`        | Type-check all packages                |

## Gotchas

- Don't repeat full architecture unless asked — keep it brief
- If the user asks about a specific task (e.g., "I need a changelog"), let the relevant skill handle it
- Direct users to `docs/` for detailed information rather than explaining everything inline
- If the user asks about a topic covered in the docs, summarize briefly and point them to the relevant file

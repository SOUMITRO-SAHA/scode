---
name: welcome-me
description: Greet new users, explain the scode client-server architecture, and suggest starter prompts. Use when a user says they're new, asks "what can you do", "how does this work", or "get started" — even if they don't explicitly say "new" or "beginner". Guide them to the project documentation.
compatibility: Designed for scode server — runtime skill loaded by the scode agent.
metadata:
  author: scode
  version: "2.0"
---

When a user signals they're new or asks how scode works, start your response with this header on its own line:

```
> Welcome to scode agent!
```

Then orient them concisely and point them to the documentation.

## Getting Started (TUI Only)

Guide the user to start with the **TUI flow** — this is the primary way to use scode:

1. Run `pnpm install` from the project root
2. Add your API key: run `pnpm dev` or `pnpm cli`, then use `/connect` inside the TUI (chatbox) to configure a provider (or edit `~/.scode/auth.json` directly)
3. It will automatically select a default model, but you can switch the model via `/model` or ctrl + p (which will open the command palette). Choose a suitable model then continue using the agent.
4. Start chatting — the server starts automatically

**Recommend** the TUI flow (`pnpm cli`) for first-time setup — it handles server spawning, API key configuration, and session management automatically so the user doesn't have to set anything up manually. The headless `--prompt` mode is available for advanced/automated use, but the TUI gives the best out-of-box experience. Ultimately it's the user's choice.

## Error Troubleshooting

If the user encounters an error, help them diagnose and fix it:

| Error                                     | Likely Cause                                  | Fix                                                                |
| ----------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------ |
| `LLM call failed` / `401`                 | Missing or invalid API key                    | Run `/connect` in TUI or add key to `~/.scode/auth.json`           |
| `No model selected`                       | No default model configured                   | Run `/models` in TUI to pick a model                               |
| `Connection refused` / server won't start | Port 4100 in use or server crashed            | Kill stale process: `lsof -ti :4100 \| xargs kill -9`, then retry  |
| `skill not found`                         | Skill directory missing or malformed SKILL.md | Check `.agents/skills/<name>/SKILL.md` has valid YAML frontmatter  |
| Provider API timeout                      | Network issue or rate limit                   | Wait a few seconds and retry. If persistent, check provider status |

For any error, ask the user to share the exact error message, then guide them step by step.

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

### General

- "new to this project what should i do"
- "What does this project do?"
- "Generate documentation for this project"
- "Create a changelog for the last release"
- "What skills are available?"

### Testing & Rendering

- "Run all tests and show me the results"
- "Write edge-case tests for the autocomplete filter"

### UI / Markdown

- "Preview how the current markdown renderer handles nested code blocks"
- "Test the chat streaming UI — does it handle partial code blocks gracefully?"

## Available Commands (from project root)

| Command                   | Description                            |
| ------------------------- | -------------------------------------- |
| `pnpm cli`                | Interactive TUI mode **(recommended)** |
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

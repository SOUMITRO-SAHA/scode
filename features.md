# Features (v0)

## CLI (Terminal Client)

- **TUI Mode** — Interactive terminal UI built with OpenTUI + React (`pnpm dev` or `pnpm cli`)
- **Headless REPL** — Interactive prompt-only mode without TUI (`pnpm dev:headless`)
- **Single-shot Prompt** — One-off query via `--prompt` flag (`pnpm cli --prompt "..."`)
- **Streaming Output** — Responses streamed and rendered token-by-token
- **Session Persistence** — Chat history survives across sessions, listed in sidebar
- **Command Palette** — `/` opens command palette for model switching, provider configuration, help
- **Model Switcher** — Switch between providers and models mid-session (Ctrl+P or `/model`)
- **Keyboard Shortcuts** — Full keybindings for navigation, editing, commands

## Server (Backend)

- **Singleton Process** — Single Hono HTTP server on port 4100 serves all CLI instances
- **Auto-spawning** — CLI spawns server as child process if not already running
- **Idle Shutdown** — Server auto-shuts down after timeout when no clients connected
- **Health Checks** — GET `/api/v1/health` for uptime, provider status, active clients
- **REST API** — Full CRUD for sessions, messages, config, providers, skills
- **Logging** — Persistent server logs with tail endpoint (`GET /api/v1/logs`)

## Skill System

- **Skill Discovery** — Scans `.agents/skills/`, `.opencode/skills/`, `.claude/skills/` and other standard directories for SKILL.md files
- **YAML Frontmatter Parsing** — Reads `name`, `description`, `license`, `compatibility` from skill metadata
- **Keyword Matching** — Tokenizes prompts and skill metadata, scores by keyword overlap (exact + fuzzy) to select relevant skills
- **Dynamic Skill Loading** — LLM can load full skill instructions mid-conversation via the `skill` tool
- **Constrained Tool Enum** — Tool definition restricts skill names to loaded skills for valid LLM choices

## Built-in Skills

- **welcome-me** — Greets new users, explains client-server architecture, suggests starter prompts, points to docs
- **changelog** — Generates changelogs from `git log --oneline` history with semantic versioning awareness
- **documentation** — Creates/updates README, CONTRIBUTING, and API documentation

## LLM Providers

- **Claude** (Anthropic SDK) — Default, uses `claude-sonnet-4-20250515` with extended thinking support
- **Gemini** (Google GenAI SDK) — `gemini-2.5-flash`
- **DeepSeek** — OpenAI-compatible, `deepseek-chat`
- **Z.ai / Zhipu** — OpenAI-compatible, `glm-5` / `glm-5.1` (coding plan)
- **MiniMax** — OpenAI-compatible, `minimax-m3`
- **OpenAI** — OpenAI-compatible, `gpt-4o`
- **CommandCode** — OpenAI-compatible, provider routing via commandcode.ai

## Tool System

- **read** — Read files and directories from the filesystem
- **write** — Create and overwrite files
- **edit** — Exact string replacement within files
- **bash** — Execute shell commands within the project workspace
- **grep** — Regex content search across files
- **glob** — Pattern-based file lookup
- **skill** — Dynamically load skill instructions mid-conversation

## Session Management

- **SQLite Persistence** — Sessions stored via better-sqlite3 + Drizzle ORM
- **Auto-rename** — Server automatically renames sessions by summarizing the conversation after 2 user messages
- **Multi-session** — Browse, switch between, and delete past sessions from TUI sidebar
- **History** — Full message history per session (user + assistant + tool calls)

## Configuration

- **Config File** — `~/.scode/config.json` stores theme, default provider, default model, max tokens
- **Auth File** — `~/.scode/auth.json` stores API keys per provider
- **Env Var Fallback** — API keys fall back to environment variables (`ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, etc.)
- **TUI Provider Setup** — Configure API keys interactively via `/connect` command
- **REST Endpoints** — Programmatic config and provider management via API

## Streaming

- **Chunked Transfer** — Raw text streamed over HTTP (not SSE/JSON)
- **Stream Decoding** — Multi-byte UTF-8 safe decoding with buffering
- **Tool Event Forwarding** — Tool calls and results streamed to client in real-time
- **Error Streaming** — Errors delivered as stream events, not abrupt terminations

## Developer Experience

- **Turborepo** — Monorepo orchestration with parallel task execution
- **Vitest** — Unit/integration tests with coverage (target: 100%)
- **Effect** — Type-safe error handling, dependency injection, and async workflows
- **TypeScript 6** — Strict mode with path aliases
- **tsx** — Fast TypeScript execution for development
- **Husky** — Git hooks for linting

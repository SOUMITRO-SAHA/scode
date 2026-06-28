# @scode/server

The singleton server for **scode**. Processes all prompts — skill discovery, matching, prompt building, multi-provider LLM integration, and tool execution.

Built with [Hono](https://hono.dev) on `@hono/node-server` with SQLite via Drizzle ORM.

Developed by [SOUMITRA SAHA](mailto:soumitrosahaofficial@gmail.com).

## Features

- **Multi-provider LLM support** — Claude, Gemini, DeepSeek, Z.ai (Zhipu), MiniMax, CommandCode
- **Skill system** — keyword-based skill discovery and matching
- **Tool execution** — read, write, edit, bash, grep, glob with path safety
- **Session management** — active client tracking, conversation persistence
- **SQLite database** — sessions, config, and metrics via Drizzle ORM

## API

| Endpoint          | Method | Description                            |
| ----------------- | ------ | -------------------------------------- |
| `/health`         | GET    | Health check (`{ healthy: true }`)     |
| `/process`        | POST   | Send prompt, receive streamed response |
| `/api/v1/chat`    | POST   | Chat endpoint (same handler)           |
| `/api/v1/process` | POST   | Process endpoint (same handler)        |

### POST /process

```json
{ "prompt": "Generate documentation for this project" }
```

Returns a chunked transfer stream of the LLM response text.

## Internal Flow

```
POST /process
  → discover() — walk .agents/skills/
  → loadSkill() — parse SKILL.md (YAML frontmatter + body)
  → matchSkills() — keyword overlap matching
  → buildPrompt() — construct system prompt + messages
  → streamResponse() — call LLM with tools
    ├─ text → stream to client
    ├─ tool_use → execute via registry → feed result back → continue
    └─ done → stream ends
```

## Tools

| Tool    | Handler         | Description                            |
| ------- | --------------- | -------------------------------------- |
| `read`  | `tool/read.ts`  | Read files/dirs (path safety enforced) |
| `write` | `tool/write.ts` | Create/overwrite files                 |
| `edit`  | `tool/edit.ts`  | Exact string replacement               |
| `bash`  | `tool/bash.ts`  | Shell commands with timeout            |
| `grep`  | `tool/grep.ts`  | Regex content search                   |
| `glob`  | `tool/glob.ts`  | Glob pattern file search               |

## Scripts

| Command            | Description                 |
| ------------------ | --------------------------- |
| `pnpm dev`         | Watch mode with tsx         |
| `pnpm start`       | Run server                  |
| `pnpm check-types` | Type-check                  |
| `pnpm test`        | Run tests                   |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:push`     | Push schema to database     |
| `pnpm db:studio`   | Open Drizzle Studio         |

## Configuration

```bash
# At least one API key
export ANTHROPIC_API_KEY=sk-ant-...
export GEMINI_API_KEY=...
export DEEPSEEK_API_KEY=...

pnpm start --port=4100
```

## Dependencies

- **Runtime:** Hono, Anthropic SDK, Google Gen AI, OpenAI, Cohere, Drizzle ORM, better-sqlite3, YAML, `@scode/shared`
- **Dev:** tsx, TypeScript, vitest, drizzle-kit

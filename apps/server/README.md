# @scode/server

The singleton server for scode. Processes all prompts — skill discovery, matching, prompt building, Claude Sonnet integration, and tool execution.

Built with [Hono](https://hono.dev) on `@hono/node-server`.

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check (`{ healthy: true }`) |
| `/process` | POST | Send prompt, receive streamed response |

### POST /process

```json
{ "prompt": "Generate documentation for this project" }
```

Returns a chunked transfer stream of Claude's response text.

## Internal Flow

```
POST /process
  → discover() — walk .agents/skills/
  → loadSkill() — parse SKILL.md (YAML frontmatter + body)
  → matchSkills() — keyword overlap matching
  → buildPrompt() — construct system prompt + messages
  → streamResponse() — call Claude Sonnet with tools
    ├─ text → stream to client
    ├─ tool_use → execute via registry → feed result back → continue
    └─ done → stream ends
```

## Tools

| Tool | Handler | Description |
|------|---------|-------------|
| `read` | `tool/read.ts` | Read files/dirs (path safety enforced) |
| `write` | `tool/write.ts` | Create/overwrite files |
| `edit` | `tool/edit.ts` | Exact string replacement |
| `bash` | `tool/bash.ts` | Shell commands with timeout |
| `grep` | `tool/grep.ts` | Regex content search |
| `glob` | `tool/glob.ts` | Glob pattern file search |

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Watch mode with tsx |
| `pnpm build` | Compile with tsc |
| `pnpm check-types` | Type-check |
| `pnpm start` | Run compiled server |

## Configuration

```bash
export ANTHROPIC_API_KEY=sk-ant-...
pnpm start --port=4100
```

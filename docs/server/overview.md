# Server Overview

The scode server (`@scode/server`) is a singleton Hono HTTP server that handles all AI logic. It serves multiple CLI clients concurrently.

## Architecture

```
┌────────────────────────────────────┐
│          Hono Server               │
│          (port 4100)               │
│                                    │
│  ┌──────────────────────────────┐  │
│  │       v1 Router              │  │
│  │  /health, /chat, /process,  │  │
│  │  /providers, /models,       │  │
│  │  /sessions, /skills,        │  │
│  │  /config, /logs, /stats     │  │
│  └──────────┬───────────────────┘  │
│             │                      │
│  ┌──────────▼───────────────────┐  │
│  │      Chat Handler            │  │
│  │  1. Resolve model+provider   │  │
│  │  2. Load & match skills      │  │
│  │  3. Build system prompt      │  │
│  │  4. Tool loop (max 10 iters) │  │
│  │  5. Stream response          │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────┐ ┌──────┐ ┌──────────┐  │
│  │ LLM  │ │ Tool │ │ Services │  │
│  │Adapters│ │Registry│ │(Effect)│  │
│  └──────┘ └──────┘ └──────────┘  │
└────────────────────────────────────┘
```

## Key Components

### Chat Handler (`/chat/handler.ts`)

The main conversation loop:

1. Resolve model string → provider + model
2. Resolve API key for provider
3. Get or create session
4. Load all skills, match to prompt
5. Build system prompt + tool definitions
6. Tool loop (max 10 iterations):
   - Call provider's stream response
   - Stream events: text, thought, tool_use, tool_result, error, done
   - If tool_use: execute via ToolService, feed results back
   - If no tools called: break
7. Save response to session

### Skill System

Skills are reusable prompt templates loaded from skill directories. See the [Skills documentation](../skills/overview.md).

### Tool System

The server provides tools that the LLM can call to interact with the codebase:

| Tool                       | Description                         |
| -------------------------- | ----------------------------------- |
| [read](../tools/read.md)   | Read files or list directories      |
| [write](../tools/write.md) | Create or overwrite files           |
| [edit](../tools/edit.md)   | Exact string replacement            |
| [bash](../tools/bash.md)   | Execute shell commands              |
| [grep](../tools/grep.md)   | Regex content search                |
| [glob](../tools/glob.md)   | Glob pattern file search            |
| [skill](../tools/skill.md) | Load skill instructions dynamically |

### Dependency Injection

The server uses **Effect** for dependency injection via `ManagedRuntime`:

- `ConfigService` — server configuration
- `ProviderService` — LLM provider management
- `SessionService` — session CRUD with SQLite
- `ToolService` — tool execution
- `SkillService` — skill discovery and matching
- `ActiveClientService` — connected client tracking

## Startup

```bash
pnpm server
# or
pnpm --filter @scode/server start
```

The server:

1. Initializes debug logging
2. Initializes SQLite database (creates tables if needed)
3. Initializes Effect runtime with all services
4. Cleans up empty sessions
5. Creates the Hono app and mounts routes
6. Listens on port 4100 (configurable via `--port`)

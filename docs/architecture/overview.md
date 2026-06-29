# Architecture Overview

scode is built on a **client-server architecture** where a thin CLI client communicates with a singleton backend server.

## High-Level Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                     USER TERMINAL                            │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐   │
│  │  CLI (@scode/cli)                                      │   │
│  │  ┌──────────┐  ┌────────┐  ┌────────────────────┐     │   │
│  │  │ Headless │  │  TUI   │  │  REPL (fallback)   │     │   │
│  │  │ --prompt │  │ (React)│  │  (readline)        │     │   │
│  │  └──────────┘  └────────┘  └────────────────────┘     │   │
│  │         │            │               │                │   │
│  │         └────────────┴───────────────┘                │   │
│  │                        │                              │   │
│  │               ┌────────▼────────┐                    │   │
│  │               │  ApiClient      │                    │   │
│  │               │  sendPrompt()   │                    │   │
│  │               │  useStreamChat  │                    │   │
│  │               └────────┬────────┘                    │   │
│  └────────────────────────┼──────────────────────────────┘   │
│                           │ HTTP/TCP                          │
│                           │ POST /api/v1/chat                 │
│                           │ GET  /health                      │
└───────────────────────────┼──────────────────────────────────┘
                            │
┌───────────────────────────┼──────────────────────────────────┐
│  SERVER (@scode/server)   │  Port 4100                       │
│                           ▼                                  │
│  ┌────────────────────────────────────────────────────┐      │
│  │  Hono HTTP Server                                  │      │
│  │  ┌──────────────────────────────────────────────┐  │      │
│  │  │  v1 Router                                    │  │      │
│  │  │  /health /chat /process /providers /models    │  │      │
│  │  │  /sessions /skills /config /logs /stats       │  │      │
│  │  └──────────────────┬───────────────────────────┘  │      │
│  │                     │                               │      │
│  │  ┌──────────────────▼───────────────────────────┐  │      │
│  │  │  Chat Handler                                 │  │      │
│  │  │  1. Resolve provider + model                  │  │      │
│  │  │  2. Resolve API key                           │  │      │
│  │  │  3. Get/create session (SQLite)               │  │      │
│  │  │  4. Load skills, match to prompt              │  │      │
│  │  │  5. Build system prompt + tool defs           │  │      │
│  │  │  6. Tool loop (max 10 iterations)             │  │      │
│  │  │  7. Stream response to client                 │  │      │
│  │  │  8. Persist to session                        │  │      │
│  │  └───────────────────────────────────────────────┘  │      │
│  │                                                      │      │
│  │  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │      │
│  │  │ LLM     │ │ Tools    │ │ Skills   │ │Session  │ │      │
│  │  │Adapters │ │ Registry │ │ Service  │ │Manager  │ │      │
│  │  │ Claude  │ │ read     │ │ discover │ │SQLite   │ │      │
│  │  │ Gemini  │ │ write    │ │ loader   │ │Drizzle  │ │      │
│  │  │DeepSeek │ │ edit     │ │ matcher  │ │         │ │      │
│  │  │ Z.ai    │ │ bash     │ │ service  │ │         │ │      │
│  │  │ MiniMax │ │ grep     │ └──────────┘ └─────────┘ │      │
│  │  │CommandCd│ │ glob     │                            │      │
│  │  │ OpenAI  │ │ skill    │                            │      │
│  │  └─────────┘ └──────────┘                            │      │
│  │                                                      │      │
│  │  ┌────────────────────────────────────────────────┐  │      │
│  │  │ Effect ManagedRuntime (DI Container)           │  │      │
│  │  │ ConfigService, ProviderService,                │  │      │
│  │  │ SessionService, ToolService,                   │  │      │
│  │  │ SkillService, ActiveClientService              │  │      │
│  │  └────────────────────────────────────────────────┘  │      │
│  └────────────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────────┘
```

## Design Principles

### 1. Thin Client

The CLI has zero AI logic. It only:

- Parses user input and arguments
- Communicates with the server via HTTP
- Renders streamed responses in the terminal

### 2. Singleton Server

One server process serves all CLI invocations:

- Holds all API keys (never exposed to CLI)
- Maintains LLM connections and session state
- Caches skill files and configurations
- Supports multiple concurrent clients

### 3. Auto Lifecycle

- CLI spawns the server if it's not running
- Server stays alive until idle timeout
- Last disconnecting client triggers server shutdown

### 4. Effect-Driven DI

The server uses Effect's `Context`, `Layer`, and `ManagedRuntime` for clean dependency injection, making services testable and swappable.

# Client-Server Architecture

## Communication Protocol

CLI and server communicate over HTTP/TCP on `localhost:4100`.

### Transport

- **Health checks**: Simple JSON responses (`GET /health`)
- **Chat requests**: HTTP POST with chunked transfer encoding for streaming
- **REST operations**: Standard JSON request/response for CRUD endpoints

### Stream Protocol

The chat endpoint uses newline-delimited JSON streaming:

```
← POST /api/v1/chat { "prompt": "Hello...", "model": "..." }
→ {"type": "meta", "sessionId": "ses_abc123"}
→ {"type": "text", "content": "Hello! I'm scode..."}
→ {"type": "thought", "content": "Let me think about this..."}
→ {"type": "tool_use", "name": "read", "input": {"path": "src/index.ts"}}
→ {"type": "tool_result", "name": "read", "content": "..."}
→ {"type": "text", "content": "Based on my analysis..."}
→ {"type": "done"}
```

## Client Lifecycle

```
┌─────────────┐     ┌─────────────┐
│   CLI       │     │   Server    │
└──────┬──────┘     └──────┬──────┘
       │                   │
       │  GET /health      │
       │──────────────────>│
       │<── 404 ──────────-│
       │                   │
       │  Spawn server     │
       │──────────────────>│ (child process)
       │                   │
       │  GET /health      │
       │ (poll, ×30)       │
       │<── 200 ──────────-│
       │                   │
       │  POST /active-clients│
       │──────────────────>│
       │                   │
       │  POST /api/v1/chat│
       │──────────────────>│
       │<── stream ───────-│
       │                   │
       │  DELETE /active-clients│
       │──────────────────>│
       │                   │
       │  (if last client) │
       │  shutdown         │
```

## Session Management

Sessions are persisted to SQLite and survive server restarts:

```
Session
├── id (UUID)
├── name (auto-generated or custom)
├── createdAt
├── updatedAt
├── model
├── provider
└── messages (JSON array)
  ├── { role: "system", content: "..." }
  ├── { role: "user", content: "..." }
  └── { role: "assistant", content: "..." }
```

### Auto-Naming

On the second user message in a session, the server auto-generates a name (e.g., "Refactoring components") by asking the LLM to summarize the conversation.

# Data Flow

## Prompt Processing Pipeline

```
User Prompt
    │
    ▼
┌─────────────────────┐
│ 1. Server Receives  │
│    POST /api/v1/chat│
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ 2. Resolve Model    │
│    "claude/..."     │
│    → provider+model │
│    → API key lookup │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ 3. Session          │
│    Get or create    │
│    Append user msg  │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ 4. Skill Matching   │
│    Discover skills  │
│    Match keywords   │
│    Always include   │
│    "main" fallback  │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ 5. Prompt Building  │
│    System prompt    │
│    + skill bodies   │
│    + tool defs      │
│    + message hist   │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────────────────────────────┐
│ 6. Tool Loop (max 10 iterations)             │
│                                              │
│    ┌──────────┐    ┌──────────────┐          │
│    │ Call LLM │───>│ Parse events │          │
│    └────┬─────┘    └──────┬───────┘          │
│         │                 │                  │
│         │          ┌──────▼───────┐          │
│         │          │ tool_use?    │          │
│         │          │ ┌───┐ ┌────┐ │          │
│         │          │ │Yes│ │ No │ │          │
│         │          │ └─┬─┘ └──┬─┘ │          │
│         │          │   │      └───────►Done  │
│         │          └───┼──────┘              │
│         │              │                     │
│         │     ┌────────▼───────┐             │
│         │     │ Execute tool   │             │
│         │     │ (read/write/   │             │
│         │     │  bash/grep/    │             │
│         │     │  glob/edit/    │             │
│         │     │  skill)        │             │
│         │     └────────┬───────┘             │
│         │              │                     │
│         └──────────────┘                     │
└───────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────┐
│ 7. Save to Session  │
│    Persist messages │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ 8. Auto-Rename      │
│    (if 2nd+ msg)    │
└─────────────────────┘
```

## Stream Event Types

| Event         | Purpose                    | Direction       |
| ------------- | -------------------------- | --------------- |
| `meta`        | Session ID for context     | Server → Client |
| `text`        | Response text delta        | Server → Client |
| `thought`     | AI's internal reasoning    | Server → Client |
| `tool_use`    | LLM requesting a tool call | Server → Client |
| `tool_result` | Result of tool execution   | Server → Client |
| `error`       | Error during processing    | Server → Client |
| `done`        | Stream complete            | Server → Client |

## Tool Validation

All file tools validate path safety to prevent workspace escape:

```typescript
// Pseudocode for path validation
function validatePath(requestedPath: string): void {
  const resolved = path.resolve(requestedPath);
  if (!resolved.startsWith(workspaceRoot)) {
    throw new Error(`Path ${requestedPath} is outside workspace`);
  }
}
```

Bash execution uses `execSync` with:

- 10MB max output buffer
- Configurable timeout (default: 120s)
- Working directory restrictions

# @scode/shared

Shared types and utilities used across `@scode/cli` and `@scode/server`.

## Logger (`shared/logger`)

Daily-rotating logger with compression and cleanup. Used by server and CLI.

```
~/.scode/logs/
├── scode-2026-06-25.log       # today's logs
├── scode-2026-06-10.log.gz    # compressed after 15 days
└── ...                        # deleted after 30 days
```

### Usage

```typescript
import { Logger } from "shared/logger"

const logger = new Logger()
logger.info("Server started")
logger.warn("Deprecated config", { key: "old-key" })
logger.error("Connection failed", { error: err.message })
logger.close()
```

### Behavior

| Event | Action |
|-------|--------|
| Daily rollover | New file at midnight |
| File > 15 days old | Auto-compressed to `.gz` |
| Compressed > 30 days old | Auto-deleted |
| Log dir | `~/.scode/logs/` (override with `SCODE_LOG_DIR`) |

# @scode/shared

Shared types and utilities used across `@scode/cli` and `@scode/server`.

## Logger (`shared/logger`)

Daily-rotating logger built on [Pino](https://getpino.io) + [pino-roll](https://github.com/mcollina/pino-roll).

```
~/.scode/logs/
├── scode.2026-06-25.1.log       # today's logs (JSON)
├── scode.2026-06-10.1.log.gz    # compressed after 15 days
└── ...                           # deleted after 30 days
```

### Features

- **Pino** — structured JSON logs with levels, timestamps, pid
- **pino-roll** — daily rotation with `dateFormat: yyyy-MM-dd`
- **Console** — human-readable colored output (INF/DBG/WRN/ERR)
- **Retention** — files older than 15 days gzip'd; compressed files older than 30 days deleted
- **Config** — `SCODE_LOG_DIR` env var overrides default `~/.scode/logs`

### Usage

```typescript
import { Logger } from "shared/logger"

const logger = new Logger()
logger.info("Server started")
logger.warn("Deprecated config", { key: "old-key" })
logger.error("Connection failed", { error: err.message })
logger.close()
```

### Log file format

```json
{"level":30,"time":1719323588000,"pid":12345,"hostname":"...","msg":"Server starting up"}
```

Levels: 20=debug, 30=info, 40=warn, 50=error

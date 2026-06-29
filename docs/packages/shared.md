# @scode/shared

The `@scode/shared` package provides common types, utilities, constants, and logging used by both the CLI and server.

## Import

```typescript
// Subpath exports only — no root export
import { API_ROUTES } from "@scode/shared/constants";
import { logger } from "@scode/shared/logger";
import { StreamEvent } from "@scode/shared/types";
import { apiFetch } from "@scode/shared/utils";
```

## Subpath Exports

| Subpath                   | Contents                                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------------------ |
| `@scode/shared/utils`     | API client utilities, error helpers, ID generation, JSON utils, model helpers, string/time utils |
| `@scode/shared/logger`    | Pino-based logging with log rotation                                                             |
| `@scode/shared/constants` | API routes, defaults, effort levels, endpoints, limits, paths, provider env maps                 |
| `@scode/shared/types`     | API types, entity types, stream event types                                                      |

## Key Utilities

### API (`utils/api.ts`)

```typescript
// Fetch with JSON parsing and error handling
apiFetch<T>(url: string, options?: RequestInit): Promise<T>

// Fetch with streaming response
apiFetchStream(url: string, options?: RequestInit): Promise<ReadableStream<Uint8Array>>
```

### Error Handling (`utils/error.ts`)

```typescript
// Structured error types for API and stream operations
class ApiError extends Error { ... }
class StreamError extends Error { ... }
```

### ID Generation (`utils/id.ts`)

```typescript
generateId(): string  // Generates unique IDs with prefixes
generateSessionId(): string  // ses_xxx format
generateClientId(): string   // cli_xxx format
```

### Model Helpers (`utils/model.ts`)

```typescript
// Parse "provider/model" strings
parseModelString(s: string): { provider: string; model: string }

// Format provider/model for display
formatModelString(provider: string, model: string): string
```

## Constants

| Module       | Key Exports                                                      |
| ------------ | ---------------------------------------------------------------- |
| `api-routes` | `API_ROUTES` — route path definitions                            |
| `defaults`   | `DEFAULT_PORT`, `DEFAULT_MODEL`, `DEFAULT_PROVIDER`              |
| `effort`     | `EFFORT_LEVELS` — available effort settings                      |
| `endpoints`  | Endpoint configuration                                           |
| `limits`     | `MAX_TOOL_ITERATIONS` (10), timeout values                       |
| `paths`      | `CONFIG_DIR` (`~/.scode`), `AUTH_FILE`, `CONFIG_FILE`, `DB_FILE` |
| `providers`  | `PROVIDER_ENV_MAP` — provider ID to env var mapping              |

## Logger

```typescript
import { logger } from "@scode/shared/logger";

logger.info("Server started on port 4100");
logger.error("Failed to connect to provider", { provider: "claude" });
logger.debug("Tool execution", { tool: "read", path: "src/index.ts" });
```

Uses **pino** with log rotation via `pino-roll`.

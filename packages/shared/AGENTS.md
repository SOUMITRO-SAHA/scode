# Shared Non-obvious Learnings

## Package naming

- Named `@scode/shared` in package.json. Import as `@scode/shared/logger`, `@scode/shared/constants`, `@scode/shared/types`, `@scode/shared/utils`.

## Subpath exports (NO root export)

- `"exports"` in package.json has ONLY subpath entries.
- NO `"."` root export — `import { X } from "@scode/shared"` will fail. Forces explicit domain imports.
- Each subpath points directly to `.ts` source (not compiled output).

## Available subpath modules

| Subpath       | Contents                                                 |
| ------------- | -------------------------------------------------------- |
| `./logger`    | Pino logger with daily rotation                          |
| `./constants` | Ports, URLs, paths, provider env map, defaults           |
| `./types`     | Entities, API request/response types, stream chunk codec |
| `./utils`     | `apiUrl`, `apiFetch`, `apiFetchStream`, `generateId`     |

## constants/ submodules

- `endpoints.ts` — server port, base URLs, all API v1 endpoint builders
- `paths.ts` — `SCODE_DIR`, `scodePath()`, config/auth/db/logs paths
- `providers.ts` — `PROVIDER_ENV_MAP` (provider ID → env var name)
- `defaults.ts` — `DEFAULT_MODEL_STRING`, `DEFAULT_APP_CONFIG`

## utils/ submodules

- `api.ts` — `apiUrl(path, base?)`, `apiFetch<T>(path, opts?, base?)`, `apiFetchStream(path, body, base?)`
  - Both use `axios` internally (single import point — no raw `axios` anywhere else)
  - `apiFetch<T>` handles JSON request/response, accepts `RequestInit`-style opts
  - `apiFetchStream` POSTs a body, returns `NodeJS.ReadableStream` — caller iterates with `for await (const chunk of stream)`
  - URL is constructed via `apiUrl(path, base)` → `${apiV1Base(base)}${path}`
- `id.ts` — `generateId()` UUID v4 via `uuid` package
- `model.ts` — `parseModelString(input)` returns `{providerId, model}` or null; `formatModelName(modelId)` human-readable model label

## API calling convention

Always import from `@scode/shared/utils` — never import `axios` directly. This ensures a single HTTP client entry point for consistent error handling, base URL resolution, and future changes.

## Logger

- Uses pino + pino-roll for daily rotation. Logs to `~/.scode/logs/` by default.
- Maintenance: compress `.log` files ≥15 days, delete `.gz` files ≥30 days.
- Colored console output with level prefixes: INF/DBG/WRN/ERR.
- LoggerOptions can redirect to stderr instead of file.

## TypeScript

- Uses TypeScript 6.x while consuming apps (CLI, server) use 5.x — resolution and emit behavior may differ between `tsx` runtime and `tsc`.

## apiFetchStream quirks

- Returns a `Readable` stream regardless of HTTP status code — **no 2xx check**. Callers must handle error-page bodies during iteration.
- No abort signal / timeout support (unlike `apiFetch<T>` which accepts `RequestInit` with `signal`).
- Internally casts `res.data as Readable` — type lie with no runtime validation. At runtime axios with `responseType: "stream"` does return a `stream.Readable` from the HTTP response.

## Testing (TDD)

- All logic modules have vitest coverage: metrics, model, logger, types/stream, constants, logger/utils.
- `apiFetch` and `apiFetchStream` are tested with `vi.mock("axios")` — the mock wires `axios()` calls to config assertions.
- **98.5% line/branch coverage.** Remaining uncovered lines are:
  - `logger/logger.ts` lines 38/109/115/125 — error handlers (consoleOut for warn/error, compress try-catch, runMaintenance try-catch). These are I/O edge-cases not exercised without filesystem failures.
  - `logger/types.ts`, `types/api.ts`, `types/entities.ts` — pure type exports, erased at runtime, 0% by V8 definition.
- Test files in `src/**/__tests__/` are excluded from tsconfig so `check-types` stays clean.
- Write tests first. Mock `node:fs` and `node:zlib` when testing Logger or maintenance routines.

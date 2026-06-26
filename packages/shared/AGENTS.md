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

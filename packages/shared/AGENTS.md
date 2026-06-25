# Shared Non-obvious Learnings

## Package naming
- Named `@scode/shared` in package.json. Import as `@scode/shared/logger`, `@scode/shared/constants`.

## Subpath exports (NO root export)
- `"exports"` in package.json has ONLY subpath entries: `"./logger"` and `"./constants"`.
- NO `"."` root export — `import { X } from "shared"` will fail. Forces explicit domain imports.
- Each subpath points directly to `.ts` source (not compiled output): `"./src/logger/index.ts"`.

## Logger
- Uses pino + pino-roll for daily rotation. Logs to `~/.scode/logs/` by default.
- Maintenance: compress `.log` files ≥15 days, delete `.gz` files ≥30 days.
- Colored console output with level prefixes: INF/DBG/WRN/ERR.
- LoggerOptions can redirect to stderr instead of file.

## TypeScript
- Uses TypeScript 6.x while consuming apps (CLI, server) use 5.x — resolution and emit behavior may differ between `tsx` runtime and `tsc`.

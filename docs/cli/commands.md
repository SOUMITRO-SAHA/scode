# Commands & Flags

## CLI Flags

| Flag             | Description                                                                      |
| ---------------- | -------------------------------------------------------------------------------- |
| `--prompt "..."` | Single-shot mode — sends a prompt and outputs the response to stdout, then exits |
| `--model "..."`  | Specifies which provider/model to use (e.g., `claude/claude-sonnet-4-20250515`)  |

### Examples

```bash
# Interactive TUI mode
pnpm cli

# Ask a single question
pnpm cli --prompt "Summarize the main.ts file"

# Use a specific model
pnpm cli --prompt "Refactor this component" --model "gemini/gemini-2.5-pro"
```

## Root package.json Commands

| Command             | Description                                                                                    |
| ------------------- | ---------------------------------------------------------------------------------------------- |
| `pnpm dev`          | Interactive TUI (debug mode, uses bun — OpenTUI FFI only works under bun)                      |
| `pnpm dev:headless` | REPL mode (no TUI, clean output, uses tsx)                                                     |
| `pnpm cli`          | Start the CLI (uses `scripts/cli.sh` wrapper — routes `--prompt` to tsx, else tries bun first) |
| `pnpm server`       | Start the server standalone on port 4100                                                       |
| `pnpm web`          | Start the web dev server (experimental)                                                        |
| `pnpm dev:cli`      | Dev mode for CLI with file watching (uses bun — tsx watch crashes OpenTUI FFI)                 |
| `pnpm dev:server`   | Dev mode for server with `tsx watch`                                                           |
| `pnpm dev:web`      | Dev mode for web app                                                                           |
| `pnpm demo`         | Quick demo: `pnpm dev:headless --prompt "Hello, what can you do?"`                             |
| `pnpm test`         | Run all workspace tests                                                                        |
| `pnpm lint`         | Run linting across the workspace                                                               |
| `pnpm format`       | Format all `*.{ts,tsx,md}` with Prettier                                                       |
| `pnpm check-types`  | Type-check all packages                                                                        |
| `pnpm prepare`      | Install husky hooks + effect-language-service                                                  |

## Per-Package Commands

### `@scode/cli`

```bash
pnpm --filter @scode/cli dev      # tsx watch src/index.tsx
pnpm --filter @scode/cli start    # tsx src/index.tsx
pnpm --filter @scode/cli test     # vitest run
pnpm --filter @scode/cli check-types  # tsc --noEmit
```

### `@scode/server`

```bash
pnpm --filter @scode/server dev           # tsx watch src/index.ts
pnpm --filter @scode/server start         # tsx src/index.ts
pnpm --filter @scode/server test          # vitest run
pnpm --filter @scode/server check-types   # tsc --noEmit
pnpm --filter @scode/server db:generate   # drizzle-kit generate
pnpm --filter @scode/server db:push       # drizzle-kit push
pnpm --filter @scode/server db:studio     # drizzle-kit studio
```

### `@scode/shared`

```bash
pnpm --filter @scode/shared test         # vitest run
pnpm --filter @scode/shared check-types  # tsc --noEmit
```

### `@scode/theme`

```bash
pnpm --filter @scode/theme test         # vitest run
pnpm --filter @scode/theme check-types  # tsc --noEmit
```

### `web`

```bash
pnpm --filter web dev       # vite
pnpm --filter web build     # tsc -b && vite build
pnpm --filter web lint      # eslint .
pnpm --filter web preview   # vite preview
```

# @scode/cli

The CLI client for **scode**. Thin frontend with **no AI logic** — it forwards prompts to the server and streams responses.

Built with [OpenTUI](https://opentui.org) + React for the terminal UI.

Developed by [SOUMITRA SAHA](mailto:soumitrosahaofficial@gmail.com).

## Features

- **Interactive TUI mode** — full-screen terminal app with header, scrollable output, and input box
- **Single-shot mode** (`--prompt`) — sends prompt and prints response to stdout
- **Auto server lifecycle** — spawns server as child process if not running; polls health endpoint until ready
- **Streaming** — renders LLM response token-by-token via `ReadableStream.getReader()`
- **Session management** — conversation history persisted across prompts
- **Keyboard shortcuts** — quick access to commands, model switching, and more

## How It Works

```
CLI start → health check on port 4100
  ├─ Server running → connect
  └─ No server → spawn detached child process → poll until healthy
→ Send prompt via POST /process → stream response → display
```

## Usage

```bash
# Interactive TUI
pnpm --filter @scode/cli dev

# Single-shot
pnpm cli --prompt "your prompt"

# From root
pnpm cli
```

## Scripts

| Command            | Description         |
| ------------------ | ------------------- |
| `pnpm dev`         | Watch mode with tsx |
| `pnpm start`       | Run CLI             |
| `pnpm check-types` | Type-check          |
| `pnpm test`        | Run tests           |

## Dependencies

- **Runtime:** OpenTUI, React 19, Zustand, TanStack Query, `@scode/shared`, `@scode/theme`
- **Dev:** tsx, TypeScript, vitest

# @scode/cli

The CLI client for scode. Thin frontend with **no AI logic** — it forwards prompts to the server and streams responses.

Built with [OpenTUI](https://opentui.org) + React for the terminal UI.

## Features

- **Interactive TUI mode** — full-screen terminal app with header, scrollable output, and input box
- **Single-shot mode** (`--prompt`) — sends prompt and prints response to stdout
- **Auto server lifecycle** — spawns server as child process if not running; polls health endpoint until ready
- **Streaming** — renders Claude's response token-by-token via `ReadableStream.getReader()`

## Scripts

| Command            | Description         |
| ------------------ | ------------------- |
| `pnpm dev`         | Watch mode with tsx |
| `pnpm build`       | Compile with tsc    |
| `pnpm check-types` | Type-check          |

## How It Works

```
CLI start → health check on port 4100
  ├─ Server running → connect
  └─ No server → spawn detached child process → poll until healthy
→ Send prompt via POST /process → stream response → display
```

## Usage

```bash
pnpm --filter @scode/cli dev
# or from root:
pnpm cli --prompt "your prompt"
```

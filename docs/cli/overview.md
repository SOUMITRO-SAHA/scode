# CLI Overview

The scode CLI (`@scode/cli`) is a thin terminal client with zero AI logic. It forwards prompts to the server and displays streamed responses.

## Modes

The CLI operates in three modes:

| Mode         | Description                                   | Activation                 |
| ------------ | --------------------------------------------- | -------------------------- |
| **TUI**      | Interactive terminal UI with React components | Default (no flags)         |
| **Headless** | Single-shot mode, outputs response to stdout  | `--prompt "..."`           |
| **REPL**     | Fallback readline-based REPL                  | Auto-fallback if TUI fails |

## Architecture

```
CLI Start
  → Parse flags (--prompt, --model)
  → If --prompt: headless mode (send, print, exit)
  → If no flags:
    → Bootstrap: health check on port 4100
    → If server not running: spawn it as child process
    → Register as active client
    → Start TUI (OpenTUI + React)
    → If TUI fails: fall back to REPL
```

## Startup Flow

1. **Health Check**: CLI pings `http://localhost:4100/health`
2. **Spawn Server**: If no response, spawns server via `npx tsx apps/server/src/index.ts --port=4100`
3. **Wait**: Polls `/health` up to 30 times (200ms intervals)
4. **Connect**: Registers itself as an active client
5. **Render**: Launches the OpenTUI-based React application

# Quick Start

## Prerequisites

- **Node.js** >= 18
- **pnpm** 9.x (`pnpm@9.5.0` recommended)
- **bun** >= 1.3.14 — required for TUI mode (OpenTUI's native FFI only works under bun)

## Installation

```bash
# Clone the repository
git clone <repo-url>
cd scode

# Install dependencies
pnpm install
```

## Set Up an API Key

You need at least one LLM provider API key. Set it as an environment variable:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

Or store it in the auth file (`~/.scode/auth.json`):

```json
{
  "claude": { "apiKey": "sk-ant-..." }
}
```

## Run scode

### Interactive Terminal UI (Development)

```bash
pnpm dev
```

Launches the TUI in debug mode via bun. If the server isn't running, it spawns one automatically.

### Interactive Terminal UI (Production)

```bash
pnpm cli
```

Tries bun first (faster startup), falls back to tsx.

### REPL Mode (No TUI)

```bash
pnpm dev:headless
```

Opens an interactive REPL without TUI rendering — useful if bun is unavailable or you prefer a minimal terminal session. Output is clean (no debug/info/warn logs shown by default).

### Single-Shot Mode

```bash
pnpm cli --prompt "What does this project do?"
```

Sends a single prompt, prints the response to stdout, and exits.

### Quick Demo

```bash
pnpm demo
```

Spawns the server and sends a test prompt: "Hello, what can you do?" This is `dev:headless --prompt` under the hood.

## What's Next?

- [CLI Commands & Flags](../cli/commands.md)
- [Configuration Guide](configuration.md)
- [TUI Mode Guide](../cli/tui-mode.md)

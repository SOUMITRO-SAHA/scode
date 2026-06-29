# Quick Start

## Prerequisites

- **Node.js** >= 18
- **pnpm** 9.x (`pnpm@9.5.0` recommended)
- **bun** >= 1.3.14 (optional, for faster CLI startup)

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

### Interactive Terminal UI

```bash
pnpm cli
```

This launches the OpenTUI-based interactive terminal. If the server isn't running, it spawns one automatically.

### Single-Shot Mode

```bash
pnpm cli --prompt "What does this project do?"
```

### Quick Demo

```bash
pnpm demo
```

This spawns the server and sends a test prompt: "Hello, what can you do?"

## What's Next?

- [CLI Commands & Flags](../cli/commands.md)
- [Configuration Guide](configuration.md)
- [TUI Mode Guide](../cli/tui-mode.md)

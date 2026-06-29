# Quick Start

## Prerequisites

| Tool    | Version   | Needed For                                  |
| ------- | --------- | ------------------------------------------- |
| **bun** | >= 1.3.14 | TUI mode (OpenTUI FFI only works under bun) |
| Node.js | >= 18     | All modes                                   |
| pnpm    | >= 9.0    | All modes                                   |

## Installation

```bash
git clone <repo-url>
cd scode
pnpm install
```

## Run scode

Choose the flow that matches your use case.

### Recommended: TUI Flow (bun required)

No API key setup needed upfront — configure everything inside the terminal UI.

```bash
pnpm dev
```

Inside the TUI:

1. Open the provider switcher (via command palette `/` or keybinding)
2. Add a provider with your API key
3. Start chatting

The TUI also supports these commands:

- `/connect <provider>` — add a provider
- `/disconnect <provider>` — remove a provider
- `/model` — switch models
- `/help` — list all commands

### Alternative: Headless Mode (no bun)

API key must be set upfront (no TUI to configure it).

```bash
# Set your API key first
export ANTHROPIC_API_KEY=sk-ant-...

# Interactive REPL
pnpm dev:headless

# Single-shot
pnpm dev:headless --prompt "What does this project do?"

# Or via the CLI entry
pnpm cli --prompt "What does this project do?"
```

## What's Next?

- [Configuration Guide](configuration.md) — API keys, auth file, env vars
- [CLI Commands & Flags](../cli/commands.md)
- [TUI Mode Guide](../cli/tui-mode.md)

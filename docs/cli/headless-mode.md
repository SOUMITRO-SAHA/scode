# Headless Mode

Headless mode allows you to use scode in scripts, CI/CD pipelines, or non-interactive environments.

## Usage

```bash
pnpm cli --prompt "your prompt here"
```

## Examples

```bash
# Ask a simple question
pnpm cli --prompt "What is the main architecture of this project?"

# Generate code
pnpm cli --prompt "Write a React component for a data table"

# With a specific model
pnpm cli --prompt "Refactor this file" --model "claude/claude-sonnet-4-20250515"

# Pipe input
echo "Summarize the changes in the last 5 commits" | pnpm cli --prompt
```

## Exit Codes

| Code | Meaning                                               |
| ---- | ----------------------------------------------------- |
| 0    | Success — response streamed successfully              |
| 1    | Error — server not found, streaming error, or timeout |

## Performance

Headless mode skips the TUI entirely, making it faster for batch operations. It:

- Starts the server if not running
- Sends the prompt via HTTP POST
- Streams the response to stdout
- Exits immediately after

## Use Cases

- **CI/CD pipelines**: Auto-generate changelogs, documentation, or code reviews
- **Scripting**: Integrate scode into shell scripts for automated code analysis
- **Batch processing**: Run multiple prompts programmatically
- **Editor integration**: Call scode from text editor commands

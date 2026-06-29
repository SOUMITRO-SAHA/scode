# Configuration

## API Keys

scode supports multiple LLM providers. API keys can be configured in two ways:

### 1. Environment Variables

| Provider           | Environment Variable  | Required           |
| ------------------ | --------------------- | ------------------ |
| Claude (Anthropic) | `ANTHROPIC_API_KEY`   | Yes (at least one) |
| Gemini (Google)    | `GEMINI_API_KEY`      |                    |
| DeepSeek           | `DEEPSEEK_API_KEY`    |                    |
| Z.ai (Zhipu)       | `ZHIPU_API_KEY`       |                    |
| MiniMax            | `MINIMAX_API_KEY`     |                    |
| CommandCode        | `COMMANDCODE_API_KEY` |                    |
| OpenAI             | `OPENAI_API_KEY`      |                    |

### 2. Auth File (`~/.scode/auth.json`)

```json
{
  "claude": { "apiKey": "sk-ant-..." },
  "gemini": { "apiKey": "AIza..." },
  "deepseek": { "apiKey": "sk-..." },
  "zai": { "apiKey": "..." },
  "minimax": { "apiKey": "..." },
  "openai": { "apiKey": "sk-..." },
  "commandcode": { "apiKey": "..." }
}
```

Environment variables take precedence over the auth file.

## Server Configuration (`~/.scode/config.json`)

The server stores its configuration in `~/.scode/config.json`. Manage it via the API:

```bash
# Get current config
curl http://localhost:4100/api/v1/config

# Update config
curl -X PATCH http://localhost:4100/api/v1/config \
  -H "Content-Type: application/json" \
  -d '{"defaultProvider": "claude", "defaultModel": "claude-sonnet-4-20250515"}'
```

Configurable fields:

| Field             | Type    | Description                  |
| ----------------- | ------- | ---------------------------- |
| `defaultProvider` | string  | Default LLM provider         |
| `defaultModel`    | string  | Default model identifier     |
| `theme`           | string  | UI theme                     |
| `notifications`   | boolean | Enable/disable notifications |

## Server CLI Flags

When starting the server directly (`pnpm server`), you can pass:

| Flag            | Description                 |
| --------------- | --------------------------- |
| `--port=<port>` | Server port (default: 4100) |
| `--debug`       | Enable debug logging        |

## Database

scode uses SQLite for session persistence:

- **Database location**: `~/.scode/scode.db`
- **ORM**: Drizzle
- **Driver**: `better-sqlite3`
- **Journal mode**: WAL (Write-Ahead Logging)

### Database Commands

```bash
# Generate migrations
pnpm --filter @scode/server db:generate

# Push schema to database
pnpm --filter @scode/server db:push

# Open Drizzle Studio (GUI)
pnpm --filter @scode/server db:studio
```

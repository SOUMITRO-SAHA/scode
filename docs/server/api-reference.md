# API Reference

## Base URL

All API endpoints are served from `http://localhost:4100`.

## Legacy Routes

### `GET /health`

Server health check. Returns `{ "status": "ok" }` when the server is running.

### `POST /process`

Legacy chat endpoint. Identical to `POST /api/v1/chat`.

## v1 Routes

All v1 routes are under `/api/v1`.

### Health

#### `GET /api/v1/health`

Returns detailed server status.

```json
{
  "status": "ok",
  "uptime": 1234.56,
  "providers": [
    "claude",
    "gemini",
    "deepseek",
    "zai",
    "minimax",
    "openai",
    "commandcode"
  ],
  "activeClients": 2,
  "sessionCount": 5
}
```

### Chat

#### `POST /api/v1/chat`

Send a prompt and receive a streaming response.

**Request body:**

```json
{
  "prompt": "What does this project do?",
  "model": "claude/claude-sonnet-4-20250515",
  "sessionId": "optional-session-id"
}
```

**Response:** Newline-delimited JSON stream with the following event types:

```json
{"type": "meta", "sessionId": "ses_abc123"}
{"type": "text", "content": "This project is..."}
{"type": "thought", "content": "Let me analyze the architecture..."}
{"type": "tool_use", "name": "read", "input": {"path": "src/index.ts"}}
{"type": "tool_result", "name": "read", "content": "..."}
{"type": "error", "content": "Error message"}
{"type": "done"}
```

#### `POST /api/v1/process`

Alias for `/api/v1/chat`. Identical behavior.

### Providers

#### `GET /api/v1/providers`

List available providers and their status.

```json
{
  "providers": [
    {
      "id": "claude",
      "name": "Anthropic Claude",
      "configured": true,
      "models": ["claude-sonnet-4-20250515", "claude-opus-4-20250515"]
    }
  ]
}
```

#### `POST /api/v1/providers/connect`

Save an API key for a provider.

```json
{
  "provider": "claude",
  "apiKey": "sk-ant-..."
}
```

#### `DELETE /api/v1/providers/:provider`

Remove a provider's stored API key.

#### `PATCH /api/v1/providers/default`

Set the default provider.

```json
{
  "provider": "claude"
}
```

### Models

#### `GET /api/v1/models`

List available models organized by provider.

#### `PATCH /api/v1/models/default`

Set the default model.

```json
{
  "model": "claude/claude-sonnet-4-20250515"
}
```

### Sessions

#### `GET /api/v1/sessions`

List all sessions.

```json
{
  "sessions": [
    {
      "id": "ses_abc123",
      "name": "Refactoring components",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T01:00:00Z",
      "messageCount": 3
    }
  ]
}
```

#### `POST /api/v1/sessions`

Create a new session.

```json
{
  "name": "My Session",
  "model": "claude/claude-sonnet-4-20250515",
  "provider": "claude"
}
```

#### `GET /api/v1/sessions/:id`

Get session details.

#### `PATCH /api/v1/sessions/:id`

Update session (name, model, provider).

#### `DELETE /api/v1/sessions/:id`

Delete a session and its messages.

#### `GET /api/v1/sessions/:id/messages`

Get all messages in a session.

#### `POST /api/v1/sessions/:id/messages`

Add a message to a session.

```json
{
  "role": "user",
  "content": "Hello"
}
```

### Skills

#### `GET /api/v1/skills`

List all discovered skills.

```json
{
  "skills": [
    {
      "name": "welcome-me",
      "description": "Greet new users",
      "path": ".agents/skills/welcome-me/SKILL.md"
    }
  ]
}
```

#### `GET /api/v1/skills/:name`

Get a skill's full content.

#### `POST /api/v1/skills/reload`

Clear the skill cache and reload.

#### `POST /api/v1/skills/validate`

Validate all skill files for syntax errors.

### Config

#### `GET /api/v1/config`

Get server configuration.

#### `PATCH /api/v1/config`

Update server configuration.

### System

#### `GET /api/v1/logs`

Get recent log file paths.

#### `GET /api/v1/stats`

Get server statistics (uptime, request count, etc.).

### Active Clients

#### `GET /api/v1/active-clients`

List connected clients.

#### `POST /api/v1/active-clients`

Register a client connection.

```json
{
  "clientId": "cli_abc123"
}
```

#### `DELETE /api/v1/active-clients/:clientId`

Unregister a client.

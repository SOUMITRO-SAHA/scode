# LLM Providers

scode supports multiple LLM providers through a unified adapter interface.

## Supported Providers

| Provider ID       | Name             | Adapter                         | API Key Env Var       |
| ----------------- | ---------------- | ------------------------------- | --------------------- |
| `claude`          | Anthropic Claude | ClaudeAdapter (Anthropic SDK)   | `ANTHROPIC_API_KEY`   |
| `gemini`          | Google Gemini    | GeminiAdapter (`@google/genai`) | `GEMINI_API_KEY`      |
| `deepseek`        | DeepSeek         | OpenAICompatAdapter             | `DEEPSEEK_API_KEY`    |
| `zai`             | Z.ai (Zhipu)     | OpenAICompatAdapter             | `ZHIPU_API_KEY`       |
| `zai-coding-plan` | Z.ai Coding Plan | OpenAICompatAdapter             | `ZHIPU_API_KEY`       |
| `minimax`         | MiniMax          | OpenAICompatAdapter             | `MINIMAX_API_KEY`     |
| `openai`          | OpenAI           | OpenAICompatAdapter             | `OPENAI_API_KEY`      |
| `commandcode`     | CommandCode      | CommandCodeAdapter (raw fetch)  | `COMMANDCODE_API_KEY` |

## Adapter Architecture

```
LLMProvider (interface)
  ├── ClaudeAdapter        — Anthropic SDK (streaming + tool_use)
  ├── GeminiAdapter        — Google GenAI SDK
  ├── OpenAICompatAdapter  — OpenAI SDK (used for DeepSeek, Z.ai, MiniMax, OpenAI)
  └── CommandCodeAdapter   — Raw HTTP fetch
```

The `LLMProvider` interface defines:

```typescript
interface LLMProvider {
  streamResponse(params: StreamParams): AsyncIterable<StreamEvent>;
}
```

## Default Model

| Provider    | Default Model              |
| ----------- | -------------------------- |
| Claude      | `claude-sonnet-4-20250515` |
| Gemini      | `gemini-2.5-pro`           |
| DeepSeek    | `deepseek-chat`            |
| Z.ai        | `glm-4-plus`               |
| MiniMax     | `minimax-text-01`          |
| OpenAI      | `gpt-4o`                   |
| CommandCode | `command-code`             |

## Selecting a Provider

### Via CLI

```bash
pnpm cli --prompt "Hello" --model "gemini/gemini-2.5-pro"
```

### Via TUI

Use the model switcher overlay within the TUI.

### Via Provider Switcher Command

Type `/provider` in the TUI command palette and select a provider.

## How API Keys Are Resolved

1. **Auth file** (`~/.scode/auth.json`) — JSON map of provider → API key
2. **Environment variables** — fallback if not in auth file
3. **Provider-specific env vars** — see table above

## Adding a New Provider

New OpenAI-compatible providers can be added by:

1. Adding the provider ID and base URL to `provider-service.ts`
2. Adding the environment variable mapping in `@scode/shared/src/constants/providers.ts`
3. The `OpenAICompatAdapter` handles the rest

For non-OpenAI-compatible providers, implement the `LLMProvider` interface.

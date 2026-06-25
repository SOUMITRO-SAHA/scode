import { serve } from "@hono/node-server"
import { Hono } from "hono"
import { stream } from "hono/streaming"
import { Logger } from "@scode/shared/logger"
import { DEFAULT_PORT, healthUrl } from "@scode/shared/constants"
import { ProviderRegistry } from "./llm/registry.js"
import { ClaudeAdapter } from "./llm/claude/adapter.js"
import { GeminiAdapter } from "./llm/gemini/adapter.js"
import { OpenAICompatAdapter } from "./llm/openai-compat/adapter.js"
import { CohereAdapter } from "./llm/cohere/adapter.js"
import { Registry } from "./tool/registry.js"
import * as readTool from "./tool/read.js"
import * as writeTool from "./tool/write.js"
import * as editTool from "./tool/edit.js"
import * as bashTool from "./tool/bash.js"
import * as grepTool from "./tool/grep.js"
import * as globTool from "./tool/glob.js"
import { SessionManager } from "./session/manager.js"
import { ConfigManager } from "./config/manager.js"
import { createV1Router } from "./api/v1/index.js"
import { handleChat } from "./chat/handler.js"

const DEFAULT_MODEL = "claude/claude-sonnet-4-20250515"

function buildRegistry(): Registry {
  const reg = new Registry()
  reg.register("read", readTool.definition, readTool.handler)
  reg.register("write", writeTool.definition, writeTool.handler)
  reg.register("edit", editTool.definition, editTool.handler)
  reg.register("bash", bashTool.definition, bashTool.handler)
  reg.register("grep", grepTool.definition, grepTool.handler)
  reg.register("glob", globTool.definition, globTool.handler)
  return reg
}

function buildProviderRegistry(): ProviderRegistry {
  const reg = new ProviderRegistry()
  reg.register(new ClaudeAdapter())
  reg.register(new GeminiAdapter())
  reg.register(new OpenAICompatAdapter({
    id: "deepseek",
    name: "DeepSeek",
    defaultModel: "deepseek-chat",
    baseURL: "https://api.deepseek.com/v1",
  }))
  reg.register(new OpenAICompatAdapter({
    id: "zai",
    name: "Z.ai (Zhipu)",
    defaultModel: "glm-5",
    baseURL: "https://open.bigmodel.cn/api/paas/v4",
  }))
  reg.register(new OpenAICompatAdapter({
    id: "minimax",
    name: "MiniMax",
    defaultModel: "minimax-m3",
    baseURL: "https://api.minimax.chat/v1",
  }))
  reg.register(new CohereAdapter())
  return reg
}

const logger = new Logger()
const toolRegistry = buildRegistry()
const providerRegistry = buildProviderRegistry()
const sessionManager = new SessionManager()
const configManager = new ConfigManager()
const startTime = Date.now()

const app = new Hono()

// Mount v1 API
const v1 = createV1Router({ toolRegistry, providerRegistry, sessionManager, configManager, startTime })
app.route("/api/v1", v1)

// Legacy health endpoint
app.get("/health", (c) => c.json({ healthy: true }))

// Legacy process endpoint
app.post("/process", (c) =>
  stream(c, async (s) => {
    const { prompt, model: modelString, sessionId } = await c.req.json<{ prompt: string; model?: string; sessionId?: string }>()
    const config = configManager.get()
    const modelStr = modelString ?? config.defaultModel ?? DEFAULT_MODEL
    await handleChat(
      prompt,
      modelStr,
      sessionId,
      { providerRegistry, toolRegistry, sessionManager, configManager },
      (chunk) => s.write(chunk),
    )
  }),
)

const port = Number(process.argv.find((a) => a.startsWith("--port="))?.split("=")[1] ?? DEFAULT_PORT)

serve({ fetch: app.fetch, port }, (info) => {
  logger.info(`Server ready on ${healthUrl()}`)
  logger.info(`API v1 available at http://127.0.0.1:${port}/api/v1`)
})

process.on("SIGINT", () => {
  logger.info("Server shutting down")
  logger.close()
  process.exit(0)
})

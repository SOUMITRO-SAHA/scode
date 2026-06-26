import { Hono } from "hono";
import { stream } from "hono/streaming";

import { createV1Router } from "./api/v1/index";
import { handleChat } from "./chat/handler";
import { ConfigManager } from "./config/manager";
import { getDb } from "./db/client";
import { ClaudeAdapter } from "./llm/claude/adapter";
import { CohereAdapter } from "./llm/cohere/adapter";
import { GeminiAdapter } from "./llm/gemini/adapter";
import { OpenAICompatAdapter } from "./llm/openai-compat/adapter";
import { ProviderRegistry } from "./llm/registry";
import { SessionManager } from "./session/manager";
import * as bashTool from "./tool/bash";
import * as editTool from "./tool/edit";
import * as globTool from "./tool/glob";
import * as grepTool from "./tool/grep";
import * as readTool from "./tool/read";
import { Registry } from "./tool/registry";
import * as writeTool from "./tool/write";

import { serve } from "@hono/node-server";
import { DEFAULT_PORT, healthUrl } from "@scode/shared/constants";
import { Logger } from "@scode/shared/logger";

function buildRegistry(): Registry {
  const reg = new Registry();
  reg.register("read", readTool.definition, readTool.handler);
  reg.register("write", writeTool.definition, writeTool.handler);
  reg.register("edit", editTool.definition, editTool.handler);
  reg.register("bash", bashTool.definition, bashTool.handler);
  reg.register("grep", grepTool.definition, grepTool.handler);
  reg.register("glob", globTool.definition, globTool.handler);
  return reg;
}

function buildProviderRegistry(): ProviderRegistry {
  const reg = new ProviderRegistry();
  reg.register(new ClaudeAdapter());
  reg.register(new GeminiAdapter());
  reg.register(
    new OpenAICompatAdapter({
      id: "deepseek",
      name: "DeepSeek",
      defaultModel: "deepseek-chat",
      baseURL: "https://api.deepseek.com/v1",
    }),
  );
  reg.register(
    new OpenAICompatAdapter({
      id: "zai",
      name: "Z.ai (Zhipu)",
      defaultModel: "glm-5",
      baseURL: "https://open.bigmodel.cn/api/paas/v4",
    }),
  );
  reg.register(
    new OpenAICompatAdapter({
      id: "minimax",
      name: "MiniMax",
      defaultModel: "minimax-m3",
      baseURL: "https://api.minimax.chat/v1",
    }),
  );
  reg.register(new CohereAdapter());
  return reg;
}

const logger = new Logger();
const toolRegistry = buildRegistry();
const providerRegistry = buildProviderRegistry();
const sessionManager = new SessionManager();
const configManager = new ConfigManager();
const startTime = Date.now();

getDb();
logger.info("Database initialized");

const app = new Hono();

// Mount v1 API
const v1 = createV1Router({
  toolRegistry,
  providerRegistry,
  sessionManager,
  configManager,
  startTime,
});
app.route("/api/v1", v1);

// Legacy health endpoint
app.get("/health", (c) => c.json({ healthy: true }));

// Legacy process endpoint
app.post("/process", (c) =>
  stream(c, async (s) => {
    const {
      prompt,
      message,
      model: modelString,
      sessionId,
    } = await c.req.json<{
      prompt?: string;
      message?: string;
      model?: string;
      sessionId?: string;
    }>();
    const text = message ?? prompt;
    if (!text) {
      c.status(400);
      await s.write(JSON.stringify({ error: "message or prompt required" }));
      return;
    }
    const config = configManager.get();
    const modelStr = modelString || config.defaultModel;
    if (!modelStr) {
      c.status(400);
      await s.write(
        JSON.stringify({
          error: "No model selected. Use /models to select a model.",
        }),
      );
      return;
    }
    await handleChat(
      text,
      modelStr,
      sessionId,
      { providerRegistry, toolRegistry, sessionManager, configManager },
      (chunk) => s.write(chunk),
    );
  }),
);

const port = Number(
  process.argv.find((a) => a.startsWith("--port="))?.split("=")[1] ??
    DEFAULT_PORT,
);

serve({ fetch: app.fetch, port }, (info) => {
  logger.info(`Server ready on ${healthUrl()}`);
  logger.info(`API v1 available at http://127.0.0.1:${port}/api/v1`);
});

process.on("SIGINT", () => {
  logger.info("Server shutting down");
  logger.close();
  process.exit(0);
});

import { Effect } from "effect";
import { Hono } from "hono";
import { stream } from "hono/streaming";

import { createV1Router } from "./api/v1/index";
import { handleChat } from "./chat/handler";
import { getDb } from "./db/client";
import { runtime } from "./services/app";
import {
  ActiveClientService,
  ConfigService,
  ProviderService,
  SessionService,
  SkillService,
  ToolService,
} from "./services/index";
import { logger } from "./services/logger";

import { serve } from "@hono/node-server";
import { DEFAULT_PORT, healthUrl } from "@scode/shared/constants";
import { initDebugLog } from "@scode/shared/logger";
import { encodeStreamChunk } from "@scode/shared/types";
import { errorMessage } from "@scode/shared/utils";

const runSync = Effect.runSync;

initDebugLog();

getDb();
logger.info("Database initialized");

const startTime = Date.now();

const deps = await runtime.runPromise(
  Effect.gen(function* () {
    return {
      configService: yield* ConfigService,
      providerService: yield* ProviderService,
      sessionService: yield* SessionService,
      toolService: yield* ToolService,
      activeClientService: yield* ActiveClientService,
      skillService: yield* SkillService,
    };
  }),
);

const removedEmpty = runSync(deps.sessionService.cleanupEmpty);
if (removedEmpty > 0) {
  logger.info(`Cleaned up ${removedEmpty} empty session(s) from database`);
}

const app = new Hono();

const v1 = createV1Router({ ...deps, startTime });
app.route("/api/v1", v1);

app.get("/health", (c) => c.json({ healthy: true }));

app.post("/process", (c) =>
  stream(c, async (s) => {
    try {
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
        await s.write(
          encodeStreamChunk({
            type: "error",
            message: "message or prompt required",
          }),
        );
        return;
      }
      const cfg = runSync(deps.configService.get);
      const modelStr = modelString || cfg.defaultModel;
      if (!modelStr) {
        c.status(400);
        await s.write(
          encodeStreamChunk({
            type: "error",
            message: "No model selected. Use /models to select a model.",
          }),
        );
        return;
      }
      await handleChat(
        text,
        modelStr,
        sessionId,
        {
          configService: deps.configService,
          providerService: deps.providerService,
          sessionService: deps.sessionService,
          toolService: deps.toolService,
          skillService: deps.skillService,
        },
        (chunk) => s.write(chunk),
      );
    } catch (err: unknown) {
      const msg = runSync(errorMessage(err));
      logger.error(`Process handler error: ${msg}`);
      await s.write(encodeStreamChunk({ type: "error", message: msg }));
    }
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

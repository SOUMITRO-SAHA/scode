import { Effect } from "effect";
import { Hono } from "hono";
import type { Context } from "hono";
import { stream } from "hono/streaming";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

import { handleChat } from "../../chat/handler";
import type { ConfigService } from "../../config/service";
import type { ProviderService } from "../../llm/provider-service";
import type { ActiveClientService } from "../../session/active-clients-service";
import type { SessionService } from "../../session/service";
import { discover } from "../../skill/discover";
import { loadSkill } from "../../skill/loader";
import type { SkillService } from "../../skill/service";
import type { ToolService } from "../../tool/service";

import {
  LOG_MAX_FILES,
  LOG_TAIL_LINES,
  SCODE_AUTH_PATH,
  SCODE_DIR,
  SCODE_LOGS_DIR,
} from "@scode/shared/constants";
import { Logger } from "@scode/shared/logger";
import { encodeStreamChunk } from "@scode/shared/types";
import type { AppConfig, Skill, UnifiedMessage } from "@scode/shared/types";
import { calcUptime, errorMessage } from "@scode/shared/utils";

const runSync = Effect.runSync;
const logger = new Logger();

type DepsConfig = ConfigService["Service"];
type DepsProvider = ProviderService["Service"];
type DepsSession = SessionService["Service"];
type DepsTool = ToolService["Service"];
type DepsActiveClient = ActiveClientService["Service"];
type DepsSkill = SkillService["Service"];

interface RouterDeps {
  configService: DepsConfig;
  providerService: DepsProvider;
  sessionService: DepsSession;
  toolService: DepsTool;
  activeClientService: DepsActiveClient;
  skillService: DepsSkill;
  startTime: number;
}

export function createV1Router(deps: RouterDeps): Hono {
  const router = new Hono();

  router.get("/health", (c) => {
    const cfg = runSync(deps.configService.get);
    let auth: Record<string, unknown> = {};
    try {
      if (existsSync(SCODE_AUTH_PATH))
        auth = JSON.parse(readFileSync(SCODE_AUTH_PATH, "utf-8"));
    } catch {}
    const connectedProviders = Object.keys(auth).length;
    const defaultConnected = cfg.defaultProvider
      ? !!auth[cfg.defaultProvider]
      : false;
    return c.json({
      healthy: true,
      uptime: runSync(calcUptime(deps.startTime)),
      providers: deps.providerService.listProviders().length,
      connectedProviders,
      activeClients: deps.activeClientService.getCount(),
      defaultProvider: defaultConnected ? cfg.defaultProvider : "",
      defaultModel: defaultConnected ? cfg.defaultModel : "",
    });
  });

  router.get("/providers", (c) => {
    const providers = deps.providerService.listProviders();
    let auth: Record<string, unknown> = {};
    try {
      if (existsSync(SCODE_AUTH_PATH))
        auth = JSON.parse(readFileSync(SCODE_AUTH_PATH, "utf-8"));
    } catch {}
    return c.json({
      providers: providers.map((p) => ({
        id: p.id,
        name: p.name,
        defaultModel: p.defaultModel,
        connected: !!auth[p.id],
      })),
      default: runSync(deps.configService.get).defaultProvider,
    });
  });

  router.post("/providers/connect", async (c) => {
    const { provider, apiKey } = await c.req.json<{
      provider: string;
      apiKey: string;
    }>();
    if (!provider || !apiKey) {
      return c.json({ error: "provider and apiKey required" }, 400);
    }
    let auth: Record<string, { apiKey?: string }> = {};
    try {
      if (existsSync(SCODE_AUTH_PATH))
        auth = JSON.parse(readFileSync(SCODE_AUTH_PATH, "utf-8"));
    } catch {}
    auth[provider] = { apiKey };
    if (!existsSync(SCODE_DIR)) mkdirSync(SCODE_DIR, { recursive: true });
    writeFileSync(SCODE_AUTH_PATH, JSON.stringify(auth, null, 2));
    return c.json({ ok: true, provider });
  });

  router.delete("/providers/:provider", (c) => {
    const { provider } = c.req.param();
    try {
      if (existsSync(SCODE_AUTH_PATH)) {
        const auth: Record<string, unknown> = JSON.parse(
          readFileSync(SCODE_AUTH_PATH, "utf-8"),
        );
        delete auth[provider];
        writeFileSync(SCODE_AUTH_PATH, JSON.stringify(auth, null, 2));
      }
    } catch {}
    return c.json({ ok: true, provider });
  });

  router.patch("/providers/default", async (c) => {
    const { provider } = await c.req.json<{ provider: string }>();
    const p = deps.providerService.getProvider(provider);
    if (!p) return c.json({ error: `Unknown provider: ${provider}` }, 400);
    runSync(deps.configService.set("defaultProvider", provider));
    runSync(deps.configService.set("defaultModel", p.defaultModel));
    return c.json({ ok: true, provider, defaultModel: p.defaultModel });
  });

  router.get("/models", async (c) => {
    const providers = deps.providerService.listProviders();
    let auth: Record<string, { apiKey?: string }> = {};
    try {
      if (existsSync(SCODE_AUTH_PATH))
        auth = JSON.parse(readFileSync(SCODE_AUTH_PATH, "utf-8"));
    } catch {}

    const models: Array<{
      provider: string;
      providerName: string;
      defaultModel: string;
      supportedEfforts: string[];
    }> = [];

    await Promise.all(
      providers.map(async (p) => {
        const apiKey = auth[p.id]?.apiKey;
        if (p.listModels && apiKey) {
          try {
            const modelIds = await p.listModels(apiKey);
            for (const id of modelIds) {
              models.push({
                provider: p.id,
                providerName: p.name,
                defaultModel: id,
                supportedEfforts: p.getSupportedEfforts(id),
              });
            }
            return;
          } catch {}
        }
        models.push({
          provider: p.id,
          providerName: p.name,
          defaultModel: p.defaultModel,
          supportedEfforts: p.getSupportedEfforts(p.defaultModel),
        });
      }),
    );

    const defaults: Record<string, string> = {};
    for (const m of models) {
      if (!defaults[m.provider]) defaults[m.provider] = m.defaultModel;
    }
    for (const p of providers) {
      if (!defaults[p.id]) defaults[p.id] = p.defaultModel;
    }
    const cfg = runSync(deps.configService.get);
    return c.json({ models, defaultModel: cfg.defaultModel, defaults });
  });

  router.patch("/models/default", async (c) => {
    const { model } = await c.req.json<{ model: string }>();
    if (!model) return c.json({ error: "model required" }, 400);
    try {
      const { provider } = deps.providerService.resolve(model);
      runSync(deps.configService.set("defaultModel", model));
      runSync(deps.configService.set("defaultProvider", provider.id));
      return c.json({ ok: true, model, provider: provider.id });
    } catch (e) {
      return c.json({ error: (e as Error).message }, 400);
    }
  });

  router.get("/sessions", (c) => {
    const cwd = c.req.query("cwd");
    if (!cwd) {
      return c.json({ error: "cwd query parameter required" }, 400);
    }
    const sessions = runSync(deps.sessionService.list(cwd));
    return c.json({
      sessions: sessions
        .map((s) => ({
          id: s.id,
          name: s.name,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          messageCount: s.messages.length,
          model: s.model,
          provider: s.provider,
        }))
        .filter((s) => s.messageCount > 0),
    });
  });

  router.post("/sessions", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    if (!body.cwd) {
      return c.json({ error: "cwd required" }, 400);
    }
    const cfg = runSync(deps.configService.get);
    const session = runSync(
      deps.sessionService.create(
        body.name ?? "",
        body.model ?? cfg.defaultModel,
        body.provider ?? cfg.defaultProvider,
        body.cwd,
      ),
    );
    return c.json(session, 201);
  });

  router.get("/sessions/:id", (c) => {
    const session = runSync(deps.sessionService.get(c.req.param("id")));
    if (!session) return c.json({ error: "Session not found" }, 404);
    return c.json(session);
  });

  router.patch("/sessions/:id", async (c) => {
    const session = runSync(deps.sessionService.get(c.req.param("id")));
    if (!session) return c.json({ error: "Session not found" }, 404);
    const body = await c.req.json<{
      name?: string;
      model?: string;
      provider?: string;
    }>();
    if (body.name) session.name = body.name;
    if (body.model) session.model = body.model;
    if (body.provider) session.provider = body.provider;
    runSync(deps.sessionService.update(session));
    return c.json(session);
  });

  router.delete("/sessions/:id", (c) => {
    const ok = runSync(deps.sessionService.delete(c.req.param("id")));
    if (!ok) return c.json({ error: "Session not found" }, 404);
    return c.json({ ok: true });
  });

  router.get("/sessions/:id/messages", (c) => {
    const messages = runSync(
      deps.sessionService.getMessages(c.req.param("id")),
    );
    return c.json({ messages });
  });

  router.post("/sessions/:id/messages", async (c) => {
    const { role, content } = await c.req.json<{
      role: string;
      content: string;
    }>();
    if (!role || content === undefined) {
      return c.json({ error: "role and content required" }, 400);
    }
    const session = runSync(deps.sessionService.get(c.req.param("id")));
    if (!session) return c.json({ error: "Session not found" }, 404);
    runSync(
      deps.sessionService.addMessage(c.req.param("id"), {
        role: role as UnifiedMessage["role"],
        content,
      }),
    );
    return c.json({ ok: true });
  });

  router.get("/skills", (c) => {
    const cwd = c.req.query("cwd");
    if (!cwd) {
      logger.error("[/skills] cwd query parameter missing");
      return c.json({ error: "cwd query parameter required" }, 400);
    }
    logger.info(`[/skills] Discovering skills for cwd: ${cwd}`);
    const dirs = Effect.runSync(discover(cwd));
    logger.info(`[/skills] Found ${dirs.length} skill directories`);
    const skills = dirs
      .map((d) => Effect.runSync(loadSkill(d)))
      .filter((s): s is Skill => s !== null);
    return c.json({
      skills: skills.map((s) => ({
        name: s.name,
        description: s.description,
      })),
    });
  });

  router.get("/skills/:name", (c) => {
    const cwd = c.req.query("cwd");
    if (!cwd) {
      return c.json({ error: "cwd query parameter required" }, 400);
    }
    const dirs = Effect.runSync(discover(cwd));
    for (const dir of dirs) {
      if (dir.name === c.req.param("name")) {
        const skill = Effect.runSync(loadSkill(dir));
        if (skill) return c.json(skill);
      }
    }
    return c.json({ error: "Skill not found" }, 404);
  });

  router.post("/skills/reload", (c) => {
    return c.json({ ok: true, message: "Skills cache cleared" });
  });

  router.post("/skills/validate", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    if (!body.cwd) {
      return c.json({ error: "cwd required" }, 400);
    }
    const dirs = Effect.runSync(discover(body.cwd));
    const results = dirs.map((dir) => {
      const skill = Effect.runSync(loadSkill(dir));
      return {
        name: dir.name,
        valid: skill !== null,
        error: skill ? null : "Failed to parse SKILL.md",
      };
    });
    return c.json({ results });
  });

  router
    .get("/config", (c) => {
      return c.json(runSync(deps.configService.get));
    })
    .patch("/config", async (c) => {
      const body = await c.req.json<Partial<AppConfig>>();
      const updated = runSync(deps.configService.update(body));
      return c.json(updated);
    });

  router.get("/logs", (c) => {
    const logsDir = SCODE_LOGS_DIR;
    try {
      const files = readdirSync(logsDir)
        .filter((f: string) => f.endsWith(".log"))
        .sort()
        .reverse()
        .slice(0, LOG_MAX_FILES);
      const logs = files.map((f: string) => {
        const path = join(logsDir, f);
        const content = readFileSync(path, "utf-8")
          .split("\n")
          .slice(-LOG_TAIL_LINES)
          .join("\n");
        return { file: f, size: statSync(path).size, content };
      });
      return c.json({ logs });
    } catch {
      return c.json({ logs: [] });
    }
  });

  async function chatStream(c: Context) {
    const body = await c.req.json().catch(() => ({}));
    const message = body.message ?? body.prompt;
    if (!message) {
      return c.json({ error: "message or prompt required" }, 400);
    }
    if (!body.cwd) {
      logger.error("[chatStream] cwd missing from request body");
      return c.json({ error: "cwd required" }, 400);
    }
    const cwd = body.cwd;
    logger.info(`[chatStream] Received cwd: ${cwd}`);
    return stream(c, async (s) => {
      try {
        const model = body.model;
        const provider = body.provider;
        const sessionId = body.sessionId;
        const effortLevel = body.effortLevel;
        const cfg = runSync(deps.configService.get);
        const modelStr =
          model ||
          (provider ? `${provider}/` + cfg.defaultModel : cfg.defaultModel);
        if (!modelStr) {
          s.write(
            encodeStreamChunk({
              type: "error",
              message:
                "No model selected. Use Ctrl+M or /models command to select a model.",
            }),
          );
          return;
        }
        await handleChat(
          message,
          modelStr,
          sessionId,
          cwd,
          {
            configService: deps.configService,
            providerService: deps.providerService,
            sessionService: deps.sessionService,
            toolService: deps.toolService,
            skillService: deps.skillService,
          },
          (chunk: string) => s.write(chunk),
          effortLevel,
        );
      } catch (err: unknown) {
        s.write(
          encodeStreamChunk({
            type: "error",
            message: runSync(errorMessage(err)),
          }),
        );
      }
    });
  }

  router
    .get("/chat", (c) => c.json({ error: "Use POST for streaming chat" }, 405))
    .post("/chat", chatStream);

  router
    .get("/process", (c) => c.json({ error: "Use POST for streaming" }, 405))
    .post("/process", chatStream);

  router
    .get("/active-clients", (c) => {
      return c.json({
        count: deps.activeClientService.getCount(),
        clients: deps.activeClientService.getClients(),
      });
    })
    .post("/active-clients", async (c) => {
      const body = await c.req.json().catch(() => ({}));
      const clientId = runSync(
        deps.activeClientService.registerWithCwd(body.clientId, body.cwd),
      );
      return c.json({ clientId }, 201);
    })
    .delete("/active-clients/:clientId", (c) => {
      const clientId = c.req.param("clientId");
      const { existed, count } = deps.activeClientService.unregister(clientId);
      if (!existed) return c.json({ error: "Client not found" }, 404);
      return c.json({ ok: true, wasLast: count === 0, activeCount: count });
    });

  router.get("/stats", (c) => {
    const cwd = c.req.query("cwd");
    if (!cwd) {
      return c.json({ error: "cwd query parameter required" }, 400);
    }
    const sessions = runSync(deps.sessionService.list(cwd));
    const totalMessages = sessions.reduce(
      (sum, s) => sum + s.messages.length,
      0,
    );
    const dirs = Effect.runSync(discover(cwd));
    return c.json({
      sessions: sessions.length,
      messages: totalMessages,
      providers: deps.providerService.listProviders().length,
      models: deps.providerService.listProviders().length,
      skills: dirs.length,
      uptime: runSync(calcUptime(deps.startTime)),
    });
  });

  return router;
}

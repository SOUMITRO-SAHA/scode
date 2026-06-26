import { Hono } from "hono";
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
import type { ConfigManager } from "../../config/manager";
import type { ProviderRegistry } from "../../llm/registry";
import type { ActiveClientManager } from "../../session/active-clients";
import type { SessionManager } from "../../session/manager";
import { discover } from "../../skill/discover";
import { loadSkill } from "../../skill/loader";
import type { Registry as ToolRegistry } from "../../tool/registry";

import {
  SCODE_AUTH_PATH,
  SCODE_DIR,
  SCODE_LOGS_DIR,
} from "@scode/shared/constants";

interface RouterDeps {
  toolRegistry: ToolRegistry;
  providerRegistry: ProviderRegistry;
  sessionManager: SessionManager;
  configManager: ConfigManager;
  startTime: number;
  activeClientManager: ActiveClientManager;
}

export function createV1Router(deps: RouterDeps): Hono {
  const router = new Hono();

  router.get("/health", (c) => {
    return c.json({
      healthy: true,
      uptime: Math.floor((Date.now() - deps.startTime) / 1000),
      providers: deps.providerRegistry.listProviders().length,
      sessions: deps.sessionManager.list().length,
      defaultProvider: deps.configManager.get().defaultProvider,
      defaultModel: deps.configManager.get().defaultModel,
    });
  });

  router.get("/providers", (c) => {
    const providers = deps.providerRegistry.listProviders();
    return c.json({
      providers: providers.map((p) => ({
        id: p.id,
        name: p.name,
        defaultModel: p.defaultModel,
      })),
      default: deps.configManager.get().defaultProvider,
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
    const p = deps.providerRegistry.getProvider(provider);
    if (!p) return c.json({ error: `Unknown provider: ${provider}` }, 400);
    deps.configManager.set("defaultProvider", provider);
    deps.configManager.set("defaultModel", p.defaultModel);
    return c.json({ ok: true, provider, defaultModel: p.defaultModel });
  });

  router.get("/models", (c) => {
    const providers = deps.providerRegistry.listProviders();
    const models = providers.map((p) => ({
      provider: p.id,
      providerName: p.name,
      defaultModel: p.defaultModel,
    }));
    const config = deps.configManager.get();
    return c.json({ models, defaultModel: config.defaultModel });
  });

  router.patch("/models/default", async (c) => {
    const { model } = await c.req.json<{ model: string }>();
    if (!model) return c.json({ error: "model required" }, 400);
    try {
      const { providerId } = deps.providerRegistry.parseModelString(model);
      deps.configManager.set("defaultModel", model);
      deps.configManager.set("defaultProvider", providerId);
      return c.json({ ok: true, model, provider: providerId });
    } catch (e) {
      return c.json({ error: (e as Error).message }, 400);
    }
  });

  router.get("/sessions", (c) => {
    const sessions = deps.sessionManager.list();
    return c.json({
      sessions: sessions.map((s) => ({
        id: s.id,
        name: s.name,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        messageCount: s.messages.length,
        model: s.model,
        provider: s.provider,
      })),
    });
  });

  router.post("/sessions", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const config = deps.configManager.get();
    const session = deps.sessionManager.create(
      body.name ?? "",
      body.model ?? config.defaultModel,
      body.provider ?? config.defaultProvider,
    );
    return c.json(session, 201);
  });

  router.get("/sessions/:id", (c) => {
    const session = deps.sessionManager.get(c.req.param("id"));
    if (!session) return c.json({ error: "Session not found" }, 404);
    return c.json(session);
  });

  router.patch("/sessions/:id", async (c) => {
    const session = deps.sessionManager.get(c.req.param("id"));
    if (!session) return c.json({ error: "Session not found" }, 404);
    const body = await c.req.json<{
      name?: string;
      model?: string;
      provider?: string;
    }>();
    if (body.name) session.name = body.name;
    if (body.model) session.model = body.model;
    if (body.provider) session.provider = body.provider;
    deps.sessionManager.update(session);
    return c.json(session);
  });

  router.delete("/sessions/:id", (c) => {
    const ok = deps.sessionManager.delete(c.req.param("id"));
    if (!ok) return c.json({ error: "Session not found" }, 404);
    return c.json({ ok: true });
  });

  router.get("/sessions/:id/messages", (c) => {
    const messages = deps.sessionManager.getMessages(c.req.param("id"));
    return c.json({ messages });
  });

  router.get("/skills", (c) => {
    const dirs = discover();
    const skills = dirs.map(loadSkill).filter(Boolean);
    return c.json({
      skills: skills.map((s) => ({
        name: (s as any).name,
        description: (s as any).description,
      })),
    });
  });

  router.get("/skills/:name", (c) => {
    const dirs = discover();
    for (const dir of dirs) {
      if (dir.name === c.req.param("name")) {
        const skill = loadSkill(dir);
        if (skill) return c.json(skill);
      }
    }
    return c.json({ error: "Skill not found" }, 404);
  });

  router.post("/skills/reload", (c) => {
    return c.json({ ok: true, message: "Skills cache cleared" });
  });

  router.post("/skills/validate", (c) => {
    const dirs = discover();
    const results = dirs.map((dir) => {
      const skill = loadSkill(dir);
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
      return c.json(deps.configManager.get());
    })
    .patch("/config", async (c) => {
      const body = await c.req.json<Record<string, unknown>>();
      const updated = deps.configManager.update(body as any);
      return c.json(updated);
    });

  router.get("/logs", (c) => {
    const logsDir = SCODE_LOGS_DIR;
    try {
      const files = readdirSync(logsDir)
        .filter((f: string) => f.endsWith(".log"))
        .sort()
        .reverse()
        .slice(0, 5);
      const logs = files.map((f: string) => {
        const path = join(logsDir, f);
        const content = readFileSync(path, "utf-8")
          .split("\n")
          .slice(-100)
          .join("\n");
        return { file: f, size: statSync(path).size, content };
      });
      return c.json({ logs });
    } catch {
      return c.json({ logs: [] });
    }
  });

  async function chatStream(c: any) {
    const body = await c.req.json().catch(() => ({}));
    const message = body.message ?? body.prompt;
    if (!message) {
      return c.json({ error: "message or prompt required" }, 400);
    }
    return stream(c, async (s: any) => {
      const model = body.model;
      const provider = body.provider;
      const sessionId = body.sessionId;
      const config = deps.configManager.get();
      const modelStr =
        model ||
        (provider ? `${provider}/` + config.defaultModel : config.defaultModel);
      if (!modelStr) {
        s.write(
          JSON.stringify({
            type: "error",
            message:
              "No model selected. Use Ctrl+M or /models command to select a model.",
          }),
        );
        return;
      }
      await handleChat(message, modelStr, sessionId, deps, (chunk: string) =>
        s.write(chunk),
      );
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
        count: deps.activeClientManager.getCount(),
        clients: deps.activeClientManager.getClients(),
      });
    })
    .post("/active-clients", async (c) => {
      const body = await c.req.json().catch(() => ({}));
      const clientId = deps.activeClientManager.register(body.clientId);
      return c.json({ clientId }, 201);
    })
    .delete("/active-clients/:clientId", (c) => {
      const clientId = c.req.param("clientId");
      const { existed, count } = deps.activeClientManager.unregister(clientId);
      if (!existed) return c.json({ error: "Client not found" }, 404);
      return c.json({ ok: true, wasLast: count === 0, activeCount: count });
    });

  router.get("/stats", (c) => {
    const sessions = deps.sessionManager.list();
    const totalMessages = sessions.reduce(
      (sum, s) => sum + s.messages.length,
      0,
    );
    const dirs = discover();
    return c.json({
      sessions: sessions.length,
      messages: totalMessages,
      providers: deps.providerRegistry.listProviders().length,
      models: deps.providerRegistry.listProviders().length,
      skills: dirs.length,
      uptime: Math.floor((Date.now() - deps.startTime) / 1000),
    });
  });

  return router;
}

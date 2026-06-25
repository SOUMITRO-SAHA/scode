import { Hono } from "hono"
import { stream } from "hono/streaming"
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { homedir } from "node:os"
import type { Registry as ToolRegistry } from "../../tool/registry"
import type { ProviderRegistry } from "../../llm/registry"
import type { SessionManager } from "../../session/manager"
import type { ConfigManager } from "../../config/manager"
import { discover } from "../../skill/discover"
import { loadSkill } from "../../skill/loader"
import { handleChat } from "../../chat/handler"

interface RouterDeps {
  toolRegistry: ToolRegistry
  providerRegistry: ProviderRegistry
  sessionManager: SessionManager
  configManager: ConfigManager
  startTime: number
}

export function createV1Router(deps: RouterDeps): Hono {
  const router = new Hono()

  router.get("/health", (c) => {
    return c.json({
      healthy: true,
      uptime: Math.floor((Date.now() - deps.startTime) / 1000),
      providers: deps.providerRegistry.listProviders().length,
      sessions: deps.sessionManager.list().length,
      defaultProvider: deps.configManager.get().defaultProvider,
      defaultModel: deps.configManager.get().defaultModel,
    })
  })

  router.get("/providers", (c) => {
    const providers = deps.providerRegistry.listProviders()
    return c.json({
      providers: providers.map((p) => ({
        id: p.id,
        name: p.name,
        defaultModel: p.defaultModel,
      })),
      default: deps.configManager.get().defaultProvider,
    })
  })

  router.post("/providers/connect", async (c) => {
    const { provider, apiKey } = await c.req.json<{ provider: string; apiKey: string }>()
    if (!provider || !apiKey) {
      return c.json({ error: "provider and apiKey required" }, 400)
    }
    const authPath = join(homedir(), ".scode", "auth.json")
    let auth: Record<string, { apiKey?: string }> = {}
    try {
      if (existsSync(authPath)) auth = JSON.parse(readFileSync(authPath, "utf-8"))
    } catch {}
    auth[provider] = { apiKey }
    const dir = join(homedir(), ".scode")
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    writeFileSync(authPath, JSON.stringify(auth, null, 2))
    return c.json({ ok: true, provider })
  })

  router.delete("/providers/:provider", (c) => {
    const { provider } = c.req.param()
    const authPath = join(homedir(), ".scode", "auth.json")
    try {
      if (existsSync(authPath)) {
        const auth: Record<string, unknown> = JSON.parse(readFileSync(authPath, "utf-8"))
        delete auth[provider]
        writeFileSync(authPath, JSON.stringify(auth, null, 2))
      }
    } catch {}
    return c.json({ ok: true, provider })
  })

  router.patch("/providers/default", async (c) => {
    const { provider } = await c.req.json<{ provider: string }>()
    const p = deps.providerRegistry.getProvider(provider)
    if (!p) return c.json({ error: `Unknown provider: ${provider}` }, 400)
    deps.configManager.set("defaultProvider", provider)
    deps.configManager.set("defaultModel", p.defaultModel)
    return c.json({ ok: true, provider, defaultModel: p.defaultModel })
  })

  router.get("/models", (c) => {
    const providers = deps.providerRegistry.listProviders()
    const models = providers.map((p) => ({
      provider: p.id,
      providerName: p.name,
      defaultModel: p.defaultModel,
    }))
    const config = deps.configManager.get()
    return c.json({ models, defaultModel: config.defaultModel })
  })

  router.patch("/models/default", async (c) => {
    const { model } = await c.req.json<{ model: string }>()
    if (!model) return c.json({ error: "model required" }, 400)
    try {
      const { providerId } = deps.providerRegistry.parseModelString(model)
      deps.configManager.set("defaultModel", model)
      deps.configManager.set("defaultProvider", providerId)
      return c.json({ ok: true, model, provider: providerId })
    } catch (e) {
      return c.json({ error: (e as Error).message }, 400)
    }
  })

  router.get("/sessions", (c) => {
    const sessions = deps.sessionManager.list()
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
    })
  })

  router.post("/sessions", async (c) => {
    const body = await c.req.json().catch(() => ({}))
    const config = deps.configManager.get()
    const session = deps.sessionManager.create(
      body.name ?? "",
      body.model ?? config.defaultModel,
      body.provider ?? config.defaultProvider,
    )
    return c.json(session, 201)
  })

  router.get("/sessions/:id", (c) => {
    const session = deps.sessionManager.get(c.req.param("id"))
    if (!session) return c.json({ error: "Session not found" }, 404)
    return c.json(session)
  })

  router.patch("/sessions/:id", async (c) => {
    const session = deps.sessionManager.get(c.req.param("id"))
    if (!session) return c.json({ error: "Session not found" }, 404)
    const body = await c.req.json<{ name?: string; model?: string; provider?: string }>()
    if (body.name) session.name = body.name
    if (body.model) session.model = body.model
    if (body.provider) session.provider = body.provider
    deps.sessionManager.update(session)
    return c.json(session)
  })

  router.delete("/sessions/:id", (c) => {
    const ok = deps.sessionManager.delete(c.req.param("id"))
    if (!ok) return c.json({ error: "Session not found" }, 404)
    return c.json({ ok: true })
  })

  router.get("/sessions/:id/messages", (c) => {
    const messages = deps.sessionManager.getMessages(c.req.param("id"))
    return c.json({ messages })
  })

  router.get("/skills", (c) => {
    const dirs = discover()
    const skills = dirs.map(loadSkill).filter(Boolean)
    return c.json({
      skills: skills.map((s) => ({ name: (s as any).name, description: (s as any).description })),
    })
  })

  router.get("/skills/:name", (c) => {
    const dirs = discover()
    for (const dir of dirs) {
      if (dir.name === c.req.param("name")) {
        const skill = loadSkill(dir)
        if (skill) return c.json(skill)
      }
    }
    return c.json({ error: "Skill not found" }, 404)
  })

  router.post("/skills/reload", (c) => {
    return c.json({ ok: true, message: "Skills cache cleared" })
  })

  router.post("/skills/validate", (c) => {
    const dirs = discover()
    const results = dirs.map((dir) => {
      const skill = loadSkill(dir)
      return { name: dir.name, valid: skill !== null, error: skill ? null : "Failed to parse SKILL.md" }
    })
    return c.json({ results })
  })

  router.get("/config", (c) => {
    return c.json(deps.configManager.get())
  })

  router.patch("/config", async (c) => {
    const body = await c.req.json<Record<string, unknown>>()
    const updated = deps.configManager.update(body as any)
    return c.json(updated)
  })

  router.get("/logs", (c) => {
    const logsDir = join(homedir(), ".scode", "logs")
    try {
      const files = readdirSync(logsDir)
        .filter((f: string) => f.endsWith(".log"))
        .sort()
        .reverse()
        .slice(0, 5)
      const logs = files.map((f: string) => {
        const path = join(logsDir, f)
        const content = readFileSync(path, "utf-8").split("\n").slice(-100).join("\n")
        return { file: f, size: statSync(path).size, content }
      })
      return c.json({ logs })
    } catch {
      return c.json({ logs: [] })
    }
  })

  function chatStream(c: any) {
    return stream(c, async (s: any) => {
      const body = await c.req.json().catch(() => ({}))
      const message = body.message ?? body.prompt
      const model = body.model
      const provider = body.provider
      const sessionId = body.sessionId
      if (!message) {
        await s.write(JSON.stringify({ error: "message or prompt required" }))
        return
      }
      const config = deps.configManager.get()
      const modelStr = model || (provider ? `${provider}/` + config.defaultModel : config.defaultModel)
      await handleChat(message, modelStr, sessionId, deps, (chunk: string) => s.write(chunk))
    })
  }

  router.get("/chat", (c) => c.json({ error: "Use POST for streaming chat" }, 405))
  router.get("/process", (c) => c.json({ error: "Use POST for streaming" }, 405))
  router.post("/chat", chatStream)
  router.post("/process", chatStream)

  router.get("/stats", (c) => {
    const sessions = deps.sessionManager.list()
    const totalMessages = sessions.reduce((sum, s) => sum + s.messages.length, 0)
    const dirs = discover()
    return c.json({
      sessions: sessions.length,
      messages: totalMessages,
      providers: deps.providerRegistry.listProviders().length,
      models: deps.providerRegistry.listProviders().length,
      skills: dirs.length,
      uptime: Math.floor((Date.now() - deps.startTime) / 1000),
    })
  })

  return router
}

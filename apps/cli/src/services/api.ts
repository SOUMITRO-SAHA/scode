import { apiV1Base } from "@scode/shared/constants"

interface SessionInfo {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  messageCount: number
  model: string
  provider: string
}

interface ProviderInfo {
  id: string
  name: string
  defaultModel: string
}

interface ModelInfo {
  provider: string
  providerName: string
  defaultModel: string
}

interface SkillInfo {
  name: string
  description: string
}

interface ServerConfig {
  theme: string
  defaultProvider: string
  defaultModel: string
  maxTokens: number
}

interface HealthStatus {
  healthy: boolean
  uptime: number
  providers: number
  sessions: number
  defaultProvider: string
  defaultModel: string
}

interface Stats {
  sessions: number
  messages: number
  providers: number
  models: number
  skills: number
  uptime: number
}

function apiUrl(path: string, base?: string): string {
  return `${apiV1Base(base)}${path}`
}

async function apiFetch<T>(path: string, opts?: RequestInit, base?: string): Promise<T> {
  const res = await fetch(apiUrl(path, base), {
    headers: { "Content-Type": "application/json" },
    ...opts,
  })
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`)
  return res.json() as Promise<T>
}

export class ApiClient {
  constructor(private baseUrl?: string) {}

  async health(): Promise<HealthStatus> {
    return apiFetch("/health", {}, this.baseUrl)
  }

  async stats(): Promise<Stats> {
    return apiFetch("/stats", {}, this.baseUrl)
  }

  async listProviders(): Promise<{ providers: ProviderInfo[]; default: string }> {
    return apiFetch("/providers", {}, this.baseUrl)
  }

  async connectProvider(provider: string, apiKey: string): Promise<{ ok: boolean; provider: string }> {
    return apiFetch("/providers/connect", {
      method: "POST",
      body: JSON.stringify({ provider, apiKey }),
    }, this.baseUrl)
  }

  async disconnectProvider(provider: string): Promise<{ ok: boolean; provider: string }> {
    return apiFetch(`/providers/${encodeURIComponent(provider)}`, { method: "DELETE" }, this.baseUrl)
  }

  async setDefaultProvider(provider: string): Promise<{ ok: boolean; provider: string; defaultModel: string }> {
    return apiFetch("/providers/default", {
      method: "PATCH",
      body: JSON.stringify({ provider }),
    }, this.baseUrl)
  }

  async listModels(): Promise<{ models: ModelInfo[]; defaultModel: string }> {
    return apiFetch("/models", {}, this.baseUrl)
  }

  async setDefaultModel(model: string): Promise<{ ok: boolean; model: string; provider: string }> {
    return apiFetch("/models/default", {
      method: "PATCH",
      body: JSON.stringify({ model }),
    }, this.baseUrl)
  }

  async listSessions(): Promise<{ sessions: SessionInfo[] }> {
    return apiFetch("/sessions", {}, this.baseUrl)
  }

  async createSession(name?: string, model?: string, provider?: string): Promise<any> {
    return apiFetch("/sessions", {
      method: "POST",
      body: JSON.stringify({ name, model, provider }),
    }, this.baseUrl)
  }

  async getSession(id: string): Promise<any> {
    return apiFetch(`/sessions/${encodeURIComponent(id)}`, {}, this.baseUrl)
  }

  async renameSession(id: string, name: string): Promise<any> {
    return apiFetch(`/sessions/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    }, this.baseUrl)
  }

  async deleteSession(id: string): Promise<{ ok: boolean }> {
    return apiFetch(`/sessions/${encodeURIComponent(id)}`, { method: "DELETE" }, this.baseUrl)
  }

  async getMessages(id: string): Promise<{ messages: any[] }> {
    return apiFetch(`/sessions/${encodeURIComponent(id)}/messages`, {}, this.baseUrl)
  }

  async listSkills(): Promise<{ skills: SkillInfo[] }> {
    return apiFetch("/skills", {}, this.baseUrl)
  }

  async getSkill(name: string): Promise<any> {
    return apiFetch(`/skills/${encodeURIComponent(name)}`, {}, this.baseUrl)
  }

  async reloadSkills(): Promise<{ ok: boolean; message: string }> {
    return apiFetch("/skills/reload", { method: "POST" }, this.baseUrl)
  }

  async validateSkills(): Promise<{ results: { name: string; valid: boolean; error: string | null }[] }> {
    return apiFetch("/skills/validate", { method: "POST" }, this.baseUrl)
  }

  async getConfig(): Promise<ServerConfig> {
    return apiFetch("/config", {}, this.baseUrl)
  }

  async updateConfig(partial: Partial<ServerConfig>): Promise<ServerConfig> {
    return apiFetch("/config", {
      method: "PATCH",
      body: JSON.stringify(partial),
    }, this.baseUrl)
  }

  async getLogs(): Promise<{ logs: { file: string; size: number; content: string }[] }> {
    return apiFetch("/logs", {}, this.baseUrl)
  }
}

import type {
  ActiveClientsResponse,
  HealthStatus,
  ModelInfo,
  ProviderInfo,
  RegisterClientResponse,
  ServerConfig,
  SessionInfo,
  SkillInfo,
  Stats,
  UnregisterClientResponse,
} from "@scode/shared/types";
import { apiFetch } from "@scode/shared/utils";

export class ApiClient {
  constructor(private baseUrl?: string) {}

  async health(): Promise<HealthStatus> {
    return apiFetch("/health", {}, this.baseUrl);
  }

  async stats(): Promise<Stats> {
    return apiFetch("/stats", {}, this.baseUrl);
  }

  async listProviders(): Promise<{
    providers: ProviderInfo[];
    default: string;
  }> {
    return apiFetch("/providers", {}, this.baseUrl);
  }

  async connectProvider(
    provider: string,
    apiKey: string,
  ): Promise<{ ok: boolean; provider: string }> {
    return apiFetch(
      "/providers/connect",
      {
        method: "POST",
        body: JSON.stringify({ provider, apiKey }),
      },
      this.baseUrl,
    );
  }

  async disconnectProvider(
    provider: string,
  ): Promise<{ ok: boolean; provider: string }> {
    return apiFetch(
      `/providers/${encodeURIComponent(provider)}`,
      { method: "DELETE" },
      this.baseUrl,
    );
  }

  async setDefaultProvider(
    provider: string,
  ): Promise<{ ok: boolean; provider: string; defaultModel: string }> {
    return apiFetch(
      "/providers/default",
      {
        method: "PATCH",
        body: JSON.stringify({ provider }),
      },
      this.baseUrl,
    );
  }

  async listModels(): Promise<{ models: ModelInfo[]; defaultModel: string }> {
    return apiFetch("/models", {}, this.baseUrl);
  }

  async setDefaultModel(
    model: string,
  ): Promise<{ ok: boolean; model: string; provider: string }> {
    return apiFetch(
      "/models/default",
      {
        method: "PATCH",
        body: JSON.stringify({ model }),
      },
      this.baseUrl,
    );
  }

  async listSessions(): Promise<{ sessions: SessionInfo[] }> {
    return apiFetch("/sessions", {}, this.baseUrl);
  }

  async createSession(
    name?: string,
    model?: string,
    provider?: string,
  ): Promise<any> {
    return apiFetch(
      "/sessions",
      {
        method: "POST",
        body: JSON.stringify({ name, model, provider }),
      },
      this.baseUrl,
    );
  }

  async getSession(id: string): Promise<any> {
    return apiFetch(`/sessions/${encodeURIComponent(id)}`, {}, this.baseUrl);
  }

  async renameSession(id: string, name: string): Promise<any> {
    return apiFetch(
      `/sessions/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: JSON.stringify({ name }),
      },
      this.baseUrl,
    );
  }

  async deleteSession(id: string): Promise<{ ok: boolean }> {
    return apiFetch(
      `/sessions/${encodeURIComponent(id)}`,
      { method: "DELETE" },
      this.baseUrl,
    );
  }

  async getMessages(id: string): Promise<{ messages: any[] }> {
    return apiFetch(
      `/sessions/${encodeURIComponent(id)}/messages`,
      {},
      this.baseUrl,
    );
  }

  async listSkills(): Promise<{ skills: SkillInfo[] }> {
    return apiFetch("/skills", {}, this.baseUrl);
  }

  async getSkill(name: string): Promise<any> {
    return apiFetch(`/skills/${encodeURIComponent(name)}`, {}, this.baseUrl);
  }

  async reloadSkills(): Promise<{ ok: boolean; message: string }> {
    return apiFetch("/skills/reload", { method: "POST" }, this.baseUrl);
  }

  async validateSkills(): Promise<{
    results: { name: string; valid: boolean; error: string | null }[];
  }> {
    return apiFetch("/skills/validate", { method: "POST" }, this.baseUrl);
  }

  async getConfig(): Promise<ServerConfig> {
    return apiFetch("/config", {}, this.baseUrl);
  }

  async updateConfig(partial: Partial<ServerConfig>): Promise<ServerConfig> {
    return apiFetch(
      "/config",
      {
        method: "PATCH",
        body: JSON.stringify(partial),
      },
      this.baseUrl,
    );
  }

  async getLogs(): Promise<{
    logs: { file: string; size: number; content: string }[];
  }> {
    return apiFetch("/logs", {}, this.baseUrl);
  }

  async getActiveClients(): Promise<ActiveClientsResponse> {
    return apiFetch("/active-clients", {}, this.baseUrl);
  }

  async registerClient(): Promise<RegisterClientResponse> {
    return apiFetch("/active-clients", { method: "POST" }, this.baseUrl);
  }

  async unregisterClient(clientId: string): Promise<UnregisterClientResponse> {
    return apiFetch(
      `/active-clients/${encodeURIComponent(clientId)}`,
      { method: "DELETE" },
      this.baseUrl,
    );
  }
}

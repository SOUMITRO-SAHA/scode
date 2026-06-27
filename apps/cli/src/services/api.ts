import * as Effect from "effect/Effect";

import { ServerConnectionError } from "./errors";

import type {
  ActiveClientsResponse,
  HealthStatus,
  MessagesResponse,
  ModelInfo,
  ProviderInfo,
  RegisterClientResponse,
  ServerConfig,
  SessionInfo,
  SessionResponse,
  SkillInfo,
  SkillResponse,
  Stats,
  UnregisterClientResponse,
} from "@scode/shared/types";
import { apiFetch } from "@scode/shared/utils";

export class ApiClient {
  constructor(private baseUrl: string) {}

  health(): Effect.Effect<HealthStatus, ServerConnectionError> {
    return Effect.tryPromise({
      try: () => apiFetch("/health", {}, this.baseUrl),
      catch: (cause) =>
        new ServerConnectionError({
          url: `${this.baseUrl}/health`,
          attempt: 1,
          cause,
        }),
    });
  }

  stats(): Effect.Effect<Stats, ServerConnectionError> {
    return Effect.tryPromise({
      try: () => apiFetch("/stats", {}, this.baseUrl),
      catch: (cause) =>
        new ServerConnectionError({
          url: `${this.baseUrl}/stats`,
          attempt: 1,
          cause,
        }),
    });
  }

  listProviders(): Effect.Effect<
    { providers: ProviderInfo[]; default: string },
    ServerConnectionError
  > {
    return Effect.tryPromise({
      try: () => apiFetch("/providers", {}, this.baseUrl),
      catch: (cause) =>
        new ServerConnectionError({
          url: `${this.baseUrl}/providers`,
          attempt: 1,
          cause,
        }),
    });
  }

  connectProvider(
    provider: string,
    apiKey: string,
  ): Effect.Effect<{ ok: boolean; provider: string }, ServerConnectionError> {
    return Effect.tryPromise({
      try: () =>
        apiFetch(
          "/providers/connect",
          {
            method: "POST",
            body: JSON.stringify({ provider, apiKey }),
          },
          this.baseUrl,
        ),
      catch: (cause) =>
        new ServerConnectionError({
          url: `${this.baseUrl}/providers/connect`,
          attempt: 1,
          cause,
        }),
    });
  }

  disconnectProvider(
    provider: string,
  ): Effect.Effect<{ ok: boolean; provider: string }, ServerConnectionError> {
    return Effect.tryPromise({
      try: () =>
        apiFetch(
          `/providers/${encodeURIComponent(provider)}`,
          { method: "DELETE" },
          this.baseUrl,
        ),
      catch: (cause) =>
        new ServerConnectionError({
          url: `${this.baseUrl}/providers/${encodeURIComponent(provider)}`,
          attempt: 1,
          cause,
        }),
    });
  }

  setDefaultProvider(
    provider: string,
  ): Effect.Effect<
    { ok: boolean; provider: string; defaultModel: string },
    ServerConnectionError
  > {
    return Effect.tryPromise({
      try: () =>
        apiFetch(
          "/providers/default",
          {
            method: "PATCH",
            body: JSON.stringify({ provider }),
          },
          this.baseUrl,
        ),
      catch: (cause) =>
        new ServerConnectionError({
          url: `${this.baseUrl}/providers/default`,
          attempt: 1,
          cause,
        }),
    });
  }

  listModels(): Effect.Effect<
    { models: ModelInfo[]; defaultModel: string },
    ServerConnectionError
  > {
    return Effect.tryPromise({
      try: () => apiFetch("/models", {}, this.baseUrl),
      catch: (cause) =>
        new ServerConnectionError({
          url: `${this.baseUrl}/models`,
          attempt: 1,
          cause,
        }),
    });
  }

  setDefaultModel(
    model: string,
  ): Effect.Effect<
    { ok: boolean; model: string; provider: string },
    ServerConnectionError
  > {
    return Effect.tryPromise({
      try: () =>
        apiFetch(
          "/models/default",
          {
            method: "PATCH",
            body: JSON.stringify({ model }),
          },
          this.baseUrl,
        ),
      catch: (cause) =>
        new ServerConnectionError({
          url: `${this.baseUrl}/models/default`,
          attempt: 1,
          cause,
        }),
    });
  }

  listSessions(): Effect.Effect<
    { sessions: SessionInfo[] },
    ServerConnectionError
  > {
    return Effect.tryPromise({
      try: () => apiFetch("/sessions", {}, this.baseUrl),
      catch: (cause) =>
        new ServerConnectionError({
          url: `${this.baseUrl}/sessions`,
          attempt: 1,
          cause,
        }),
    });
  }

  createSession(
    name?: string,
    model?: string,
    provider?: string,
  ): Effect.Effect<SessionResponse, ServerConnectionError> {
    return Effect.tryPromise({
      try: () =>
        apiFetch(
          "/sessions",
          {
            method: "POST",
            body: JSON.stringify({ name, model, provider }),
          },
          this.baseUrl,
        ),
      catch: (cause) =>
        new ServerConnectionError({
          url: `${this.baseUrl}/sessions`,
          attempt: 1,
          cause,
        }),
    });
  }

  getSession(
    id: string,
  ): Effect.Effect<SessionResponse, ServerConnectionError> {
    return Effect.tryPromise({
      try: () =>
        apiFetch(`/sessions/${encodeURIComponent(id)}`, {}, this.baseUrl),
      catch: (cause) =>
        new ServerConnectionError({
          url: `${this.baseUrl}/sessions/${encodeURIComponent(id)}`,
          attempt: 1,
          cause,
        }),
    });
  }

  renameSession(
    id: string,
    name: string,
  ): Effect.Effect<SessionResponse, ServerConnectionError> {
    return Effect.tryPromise({
      try: () =>
        apiFetch(
          `/sessions/${encodeURIComponent(id)}`,
          {
            method: "PATCH",
            body: JSON.stringify({ name }),
          },
          this.baseUrl,
        ),
      catch: (cause) =>
        new ServerConnectionError({
          url: `${this.baseUrl}/sessions/${encodeURIComponent(id)}`,
          attempt: 1,
          cause,
        }),
    });
  }

  deleteSession(
    id: string,
  ): Effect.Effect<{ ok: boolean }, ServerConnectionError> {
    return Effect.tryPromise({
      try: () =>
        apiFetch(
          `/sessions/${encodeURIComponent(id)}`,
          { method: "DELETE" },
          this.baseUrl,
        ),
      catch: (cause) =>
        new ServerConnectionError({
          url: `${this.baseUrl}/sessions/${encodeURIComponent(id)}`,
          attempt: 1,
          cause,
        }),
    });
  }

  getMessages(
    id: string,
  ): Effect.Effect<MessagesResponse, ServerConnectionError> {
    return Effect.tryPromise({
      try: () =>
        apiFetch(
          `/sessions/${encodeURIComponent(id)}/messages`,
          {},
          this.baseUrl,
        ),
      catch: (cause) =>
        new ServerConnectionError({
          url: `${this.baseUrl}/sessions/${encodeURIComponent(id)}/messages`,
          attempt: 1,
          cause,
        }),
    });
  }

  listSkills(): Effect.Effect<{ skills: SkillInfo[] }, ServerConnectionError> {
    return Effect.tryPromise({
      try: () => apiFetch("/skills", {}, this.baseUrl),
      catch: (cause) =>
        new ServerConnectionError({
          url: `${this.baseUrl}/skills`,
          attempt: 1,
          cause,
        }),
    });
  }

  getSkill(name: string): Effect.Effect<SkillResponse, ServerConnectionError> {
    return Effect.tryPromise({
      try: () =>
        apiFetch(`/skills/${encodeURIComponent(name)}`, {}, this.baseUrl),
      catch: (cause) =>
        new ServerConnectionError({
          url: `${this.baseUrl}/skills/${encodeURIComponent(name)}`,
          attempt: 1,
          cause,
        }),
    });
  }

  reloadSkills(): Effect.Effect<
    { ok: boolean; message: string },
    ServerConnectionError
  > {
    return Effect.tryPromise({
      try: () => apiFetch("/skills/reload", { method: "POST" }, this.baseUrl),
      catch: (cause) =>
        new ServerConnectionError({
          url: `${this.baseUrl}/skills/reload`,
          attempt: 1,
          cause,
        }),
    });
  }

  validateSkills(): Effect.Effect<
    {
      results: { name: string; valid: boolean; error: string | null }[];
    },
    ServerConnectionError
  > {
    return Effect.tryPromise({
      try: () => apiFetch("/skills/validate", { method: "POST" }, this.baseUrl),
      catch: (cause) =>
        new ServerConnectionError({
          url: `${this.baseUrl}/skills/validate`,
          attempt: 1,
          cause,
        }),
    });
  }

  getConfig(): Effect.Effect<ServerConfig, ServerConnectionError> {
    return Effect.tryPromise({
      try: () => apiFetch("/config", {}, this.baseUrl),
      catch: (cause) =>
        new ServerConnectionError({
          url: `${this.baseUrl}/config`,
          attempt: 1,
          cause,
        }),
    });
  }

  updateConfig(
    partial: Partial<ServerConfig>,
  ): Effect.Effect<ServerConfig, ServerConnectionError> {
    return Effect.tryPromise({
      try: () =>
        apiFetch(
          "/config",
          {
            method: "PATCH",
            body: JSON.stringify(partial),
          },
          this.baseUrl,
        ),
      catch: (cause) =>
        new ServerConnectionError({
          url: `${this.baseUrl}/config`,
          attempt: 1,
          cause,
        }),
    });
  }

  getLogs(): Effect.Effect<
    {
      logs: { file: string; size: number; content: string }[];
    },
    ServerConnectionError
  > {
    return Effect.tryPromise({
      try: () => apiFetch("/logs", {}, this.baseUrl),
      catch: (cause) =>
        new ServerConnectionError({
          url: `${this.baseUrl}/logs`,
          attempt: 1,
          cause,
        }),
    });
  }

  getActiveClients(): Effect.Effect<
    ActiveClientsResponse,
    ServerConnectionError
  > {
    return Effect.tryPromise({
      try: () => apiFetch("/active-clients", {}, this.baseUrl),
      catch: (cause) =>
        new ServerConnectionError({
          url: `${this.baseUrl}/active-clients`,
          attempt: 1,
          cause,
        }),
    });
  }

  registerClient(): Effect.Effect<
    RegisterClientResponse,
    ServerConnectionError
  > {
    return Effect.tryPromise({
      try: () => apiFetch("/active-clients", { method: "POST" }, this.baseUrl),
      catch: (cause) =>
        new ServerConnectionError({
          url: `${this.baseUrl}/active-clients`,
          attempt: 1,
          cause,
        }),
    });
  }

  unregisterClient(
    clientId: string,
  ): Effect.Effect<UnregisterClientResponse, ServerConnectionError> {
    return Effect.tryPromise({
      try: () =>
        apiFetch(
          `/active-clients/${encodeURIComponent(clientId)}`,
          { method: "DELETE" },
          this.baseUrl,
        ),
      catch: (cause) =>
        new ServerConnectionError({
          url: `${this.baseUrl}/active-clients/${encodeURIComponent(clientId)}`,
          attempt: 1,
          cause,
        }),
    });
  }
}

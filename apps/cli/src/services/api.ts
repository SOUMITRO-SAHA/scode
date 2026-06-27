import * as Effect from "effect/Effect";

import { ServerConnectionError } from "./errors";

import {
  ACTIVE_CLIENTS_PATH,
  CONFIG_PATH,
  HEALTH_PATH,
  LOGS_PATH,
  MODELS_PATH,
  MODEL_DEFAULT_PATH,
  PROVIDERS_PATH,
  PROVIDER_CONNECT_PATH,
  PROVIDER_DEFAULT_PATH,
  SESSIONS_PATH,
  SKILLS_PATH,
  SKILLS_RELOAD_PATH,
  SKILLS_VALIDATE_PATH,
  STATS_PATH,
  activeClientPath,
  providerPath,
  sessionMessagesPath,
  sessionPath,
  skillPath,
} from "@scode/shared/constants";
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
    return apiFetch<HealthStatus>(HEALTH_PATH, {}, this.baseUrl).pipe(
      Effect.catch((cause) =>
        Effect.fail(
          new ServerConnectionError({
            url: `${this.baseUrl}/health`,
            attempt: 1,
            cause,
          }),
        ),
      ),
    );
  }

  stats(): Effect.Effect<Stats, ServerConnectionError> {
    return apiFetch<Stats>(STATS_PATH, {}, this.baseUrl).pipe(
      Effect.catch((cause) =>
        Effect.fail(
          new ServerConnectionError({
            url: `${this.baseUrl}/stats`,
            attempt: 1,
            cause,
          }),
        ),
      ),
    );
  }

  listProviders(): Effect.Effect<
    { providers: ProviderInfo[]; default: string },
    ServerConnectionError
  > {
    return apiFetch<{ providers: ProviderInfo[]; default: string }>(
      PROVIDERS_PATH,
      {},
      this.baseUrl,
    ).pipe(
      Effect.catch((cause) =>
        Effect.fail(
          new ServerConnectionError({
            url: `${this.baseUrl}/providers`,
            attempt: 1,
            cause,
          }),
        ),
      ),
    );
  }

  connectProvider(
    provider: string,
    apiKey: string,
  ): Effect.Effect<{ ok: boolean; provider: string }, ServerConnectionError> {
    return apiFetch<{ ok: boolean; provider: string }>(
      PROVIDER_CONNECT_PATH,
      { method: "POST", body: JSON.stringify({ provider, apiKey }) },
      this.baseUrl,
    ).pipe(
      Effect.catch((cause) =>
        Effect.fail(
          new ServerConnectionError({
            url: `${this.baseUrl}/providers/connect`,
            attempt: 1,
            cause,
          }),
        ),
      ),
    );
  }

  disconnectProvider(
    provider: string,
  ): Effect.Effect<{ ok: boolean; provider: string }, ServerConnectionError> {
    return apiFetch<{ ok: boolean; provider: string }>(
      providerPath(provider),
      { method: "DELETE" },
      this.baseUrl,
    ).pipe(
      Effect.catch((cause) =>
        Effect.fail(
          new ServerConnectionError({
            url: `${this.baseUrl}/providers/${encodeURIComponent(provider)}`,
            attempt: 1,
            cause,
          }),
        ),
      ),
    );
  }

  setDefaultProvider(
    provider: string,
  ): Effect.Effect<
    { ok: boolean; provider: string; defaultModel: string },
    ServerConnectionError
  > {
    return apiFetch<{ ok: boolean; provider: string; defaultModel: string }>(
      PROVIDER_DEFAULT_PATH,
      { method: "PATCH", body: JSON.stringify({ provider }) },
      this.baseUrl,
    ).pipe(
      Effect.catch((cause) =>
        Effect.fail(
          new ServerConnectionError({
            url: `${this.baseUrl}/providers/default`,
            attempt: 1,
            cause,
          }),
        ),
      ),
    );
  }

  listModels(): Effect.Effect<
    { models: ModelInfo[]; defaultModel: string },
    ServerConnectionError
  > {
    return apiFetch<{ models: ModelInfo[]; defaultModel: string }>(
      MODELS_PATH,
      {},
      this.baseUrl,
    ).pipe(
      Effect.catch((cause) =>
        Effect.fail(
          new ServerConnectionError({
            url: `${this.baseUrl}/models`,
            attempt: 1,
            cause,
          }),
        ),
      ),
    );
  }

  setDefaultModel(
    model: string,
  ): Effect.Effect<
    { ok: boolean; model: string; provider: string },
    ServerConnectionError
  > {
    return apiFetch<{ ok: boolean; model: string; provider: string }>(
      MODEL_DEFAULT_PATH,
      { method: "PATCH", body: JSON.stringify({ model }) },
      this.baseUrl,
    ).pipe(
      Effect.catch((cause) =>
        Effect.fail(
          new ServerConnectionError({
            url: `${this.baseUrl}/models/default`,
            attempt: 1,
            cause,
          }),
        ),
      ),
    );
  }

  listSessions(): Effect.Effect<
    { sessions: SessionInfo[] },
    ServerConnectionError
  > {
    return apiFetch<{ sessions: SessionInfo[] }>(
      SESSIONS_PATH,
      {},
      this.baseUrl,
    ).pipe(
      Effect.catch((cause) =>
        Effect.fail(
          new ServerConnectionError({
            url: `${this.baseUrl}/sessions`,
            attempt: 1,
            cause,
          }),
        ),
      ),
    );
  }

  createSession(
    name?: string,
    model?: string,
    provider?: string,
  ): Effect.Effect<SessionResponse, ServerConnectionError> {
    return apiFetch<SessionResponse>(
      SESSIONS_PATH,
      { method: "POST", body: JSON.stringify({ name, model, provider }) },
      this.baseUrl,
    ).pipe(
      Effect.catch((cause) =>
        Effect.fail(
          new ServerConnectionError({
            url: `${this.baseUrl}/sessions`,
            attempt: 1,
            cause,
          }),
        ),
      ),
    );
  }

  getSession(
    id: string,
  ): Effect.Effect<SessionResponse, ServerConnectionError> {
    return apiFetch<SessionResponse>(sessionPath(id), {}, this.baseUrl).pipe(
      Effect.catch((cause) =>
        Effect.fail(
          new ServerConnectionError({
            url: `${this.baseUrl}/sessions/${encodeURIComponent(id)}`,
            attempt: 1,
            cause,
          }),
        ),
      ),
    );
  }

  renameSession(
    id: string,
    name: string,
  ): Effect.Effect<SessionResponse, ServerConnectionError> {
    return apiFetch<SessionResponse>(
      sessionPath(id),
      { method: "PATCH", body: JSON.stringify({ name }) },
      this.baseUrl,
    ).pipe(
      Effect.catch((cause) =>
        Effect.fail(
          new ServerConnectionError({
            url: `${this.baseUrl}/sessions/${encodeURIComponent(id)}`,
            attempt: 1,
            cause,
          }),
        ),
      ),
    );
  }

  deleteSession(
    id: string,
  ): Effect.Effect<{ ok: boolean }, ServerConnectionError> {
    return apiFetch<{ ok: boolean }>(
      sessionPath(id),
      { method: "DELETE" },
      this.baseUrl,
    ).pipe(
      Effect.catch((cause) =>
        Effect.fail(
          new ServerConnectionError({
            url: `${this.baseUrl}/sessions/${encodeURIComponent(id)}`,
            attempt: 1,
            cause,
          }),
        ),
      ),
    );
  }

  getMessages(
    id: string,
  ): Effect.Effect<MessagesResponse, ServerConnectionError> {
    return apiFetch<MessagesResponse>(
      sessionMessagesPath(id),
      {},
      this.baseUrl,
    ).pipe(
      Effect.catch((cause) =>
        Effect.fail(
          new ServerConnectionError({
            url: `${this.baseUrl}/sessions/${encodeURIComponent(id)}/messages`,
            attempt: 1,
            cause,
          }),
        ),
      ),
    );
  }

  listSkills(): Effect.Effect<{ skills: SkillInfo[] }, ServerConnectionError> {
    return apiFetch<{ skills: SkillInfo[] }>(
      SKILLS_PATH,
      {},
      this.baseUrl,
    ).pipe(
      Effect.catch((cause) =>
        Effect.fail(
          new ServerConnectionError({
            url: `${this.baseUrl}/skills`,
            attempt: 1,
            cause,
          }),
        ),
      ),
    );
  }

  getSkill(name: string): Effect.Effect<SkillResponse, ServerConnectionError> {
    return apiFetch<SkillResponse>(skillPath(name), {}, this.baseUrl).pipe(
      Effect.catch((cause) =>
        Effect.fail(
          new ServerConnectionError({
            url: `${this.baseUrl}/skills/${encodeURIComponent(name)}`,
            attempt: 1,
            cause,
          }),
        ),
      ),
    );
  }

  reloadSkills(): Effect.Effect<
    { ok: boolean; message: string },
    ServerConnectionError
  > {
    return apiFetch<{ ok: boolean; message: string }>(
      SKILLS_RELOAD_PATH,
      { method: "POST" },
      this.baseUrl,
    ).pipe(
      Effect.catch((cause) =>
        Effect.fail(
          new ServerConnectionError({
            url: `${this.baseUrl}/skills/reload`,
            attempt: 1,
            cause,
          }),
        ),
      ),
    );
  }

  validateSkills(): Effect.Effect<
    { results: { name: string; valid: boolean; error: string | null }[] },
    ServerConnectionError
  > {
    return apiFetch<{
      results: { name: string; valid: boolean; error: string | null }[];
    }>(SKILLS_VALIDATE_PATH, { method: "POST" }, this.baseUrl).pipe(
      Effect.catch((cause) =>
        Effect.fail(
          new ServerConnectionError({
            url: `${this.baseUrl}/skills/validate`,
            attempt: 1,
            cause,
          }),
        ),
      ),
    );
  }

  getConfig(): Effect.Effect<ServerConfig, ServerConnectionError> {
    return apiFetch<ServerConfig>(CONFIG_PATH, {}, this.baseUrl).pipe(
      Effect.catch((cause) =>
        Effect.fail(
          new ServerConnectionError({
            url: `${this.baseUrl}/config`,
            attempt: 1,
            cause,
          }),
        ),
      ),
    );
  }

  updateConfig(
    partial: Partial<ServerConfig>,
  ): Effect.Effect<ServerConfig, ServerConnectionError> {
    return apiFetch<ServerConfig>(
      CONFIG_PATH,
      { method: "PATCH", body: JSON.stringify(partial) },
      this.baseUrl,
    ).pipe(
      Effect.catch((cause) =>
        Effect.fail(
          new ServerConnectionError({
            url: `${this.baseUrl}/config`,
            attempt: 1,
            cause,
          }),
        ),
      ),
    );
  }

  getLogs(): Effect.Effect<
    { logs: { file: string; size: number; content: string }[] },
    ServerConnectionError
  > {
    return apiFetch<{
      logs: { file: string; size: number; content: string }[];
    }>(LOGS_PATH, {}, this.baseUrl).pipe(
      Effect.catch((cause) =>
        Effect.fail(
          new ServerConnectionError({
            url: `${this.baseUrl}/logs`,
            attempt: 1,
            cause,
          }),
        ),
      ),
    );
  }

  getActiveClients(): Effect.Effect<
    ActiveClientsResponse,
    ServerConnectionError
  > {
    return apiFetch<ActiveClientsResponse>(
      ACTIVE_CLIENTS_PATH,
      {},
      this.baseUrl,
    ).pipe(
      Effect.catch((cause) =>
        Effect.fail(
          new ServerConnectionError({
            url: `${this.baseUrl}/active-clients`,
            attempt: 1,
            cause,
          }),
        ),
      ),
    );
  }

  registerClient(): Effect.Effect<
    RegisterClientResponse,
    ServerConnectionError
  > {
    return apiFetch<RegisterClientResponse>(
      ACTIVE_CLIENTS_PATH,
      { method: "POST" },
      this.baseUrl,
    ).pipe(
      Effect.catch((cause) =>
        Effect.fail(
          new ServerConnectionError({
            url: `${this.baseUrl}/active-clients`,
            attempt: 1,
            cause,
          }),
        ),
      ),
    );
  }

  unregisterClient(
    clientId: string,
  ): Effect.Effect<UnregisterClientResponse, ServerConnectionError> {
    return apiFetch<UnregisterClientResponse>(
      activeClientPath(clientId),
      { method: "DELETE" },
      this.baseUrl,
    ).pipe(
      Effect.catch((cause) =>
        Effect.fail(
          new ServerConnectionError({
            url: `${this.baseUrl}/active-clients/${encodeURIComponent(clientId)}`,
            attempt: 1,
            cause,
          }),
        ),
      ),
    );
  }
}

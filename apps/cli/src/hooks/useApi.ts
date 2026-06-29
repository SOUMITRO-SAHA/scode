import { useMemo } from "react";

import { Effect } from "effect";

import {
  CONFIG_PATH,
  HEALTH_PATH,
  HEALTH_REFETCH_MS,
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
  providerPath,
  sessionMessagesPath,
  sessionPath,
  skillPath,
} from "@scode/shared/constants";
import { DebugLogger, Logger } from "@scode/shared/logger";
import type {
  HealthStatus,
  LogEntry,
  MessagesResponse,
  ModelInfo,
  ProviderInfo,
  ServerConfig,
  SessionInfo,
  SessionResponse,
  SkillInfo,
  SkillResponse,
  Stats,
} from "@scode/shared/types";
import { apiFetch } from "@scode/shared/utils";
import { getCwd } from "@scode/shared/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const logger = new Logger({ stderr: true });
const dbg = new DebugLogger("useApi");

export function useApiBase(serverUrl?: string) {
  return serverUrl;
}

// ── Health ──
export function useHealth(serverUrl?: string) {
  logger.debug(`[useHealth] Called with serverUrl: ${serverUrl}`);
  return useQuery({
    queryKey: ["health", serverUrl],
    queryFn: () => {
      logger.debug(`[useHealth] Fetching health with serverUrl: ${serverUrl}`);
      return Effect.runPromise(
        apiFetch<HealthStatus>(HEALTH_PATH, {}, serverUrl),
      );
    },
    refetchInterval: HEALTH_REFETCH_MS,
  });
}

export type ConnectionStatus = "initializing" | "connected" | "failed";

export function useConnectionStatus(serverUrl?: string): {
  status: ConnectionStatus;
  healthy: boolean;
} {
  const { data: health, isLoading, isError } = useHealth(serverUrl);

  if (isLoading) return { status: "initializing", healthy: false };
  if (isError || !health?.healthy) return { status: "failed", healthy: false };
  return { status: "connected", healthy: true };
}

// ── Stats ──
export function useStats(serverUrl?: string) {
  const cwd = useMemo(() => getCwd(), []);
  dbg.log(`useStats`, { serverUrl, cwd });
  return useQuery({
    queryKey: ["stats", serverUrl, cwd],
    queryFn: () =>
      Effect.runPromise(apiFetch<Stats>(STATS_PATH, {}, serverUrl)),
  });
}

// ── Providers ──
export function useProviders(serverUrl?: string) {
  return useQuery({
    queryKey: ["providers", serverUrl],
    queryFn: () =>
      Effect.runPromise(
        apiFetch<{ providers: ProviderInfo[]; default: string }>(
          PROVIDERS_PATH,
          {},
          serverUrl,
        ),
      ),
  });
}

export function useConnectProvider(serverUrl?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ provider, apiKey }: { provider: string; apiKey: string }) =>
      Effect.runPromise(
        apiFetch<{ ok: boolean; provider: string }>(
          PROVIDER_CONNECT_PATH,
          {
            method: "POST",
            body: JSON.stringify({ provider, apiKey }),
          },
          serverUrl,
        ),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["providers", serverUrl] });
      qc.invalidateQueries({ queryKey: ["models", serverUrl] });
    },
  });
}

export function useDisconnectProvider(serverUrl?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (provider: string) =>
      Effect.runPromise(
        apiFetch<{ ok: boolean; provider: string }>(
          providerPath(provider),
          { method: "DELETE" },
          serverUrl,
        ),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["providers", serverUrl] });
    },
  });
}

export function useSetDefaultProvider(serverUrl?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (provider: string) =>
      Effect.runPromise(
        apiFetch<{ ok: boolean; provider: string; defaultModel: string }>(
          PROVIDER_DEFAULT_PATH,
          {
            method: "PATCH",
            body: JSON.stringify({ provider }),
          },
          serverUrl,
        ),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["providers", serverUrl] });
    },
  });
}

// ── Models ──
export function useModels(serverUrl?: string) {
  return useQuery({
    queryKey: ["models", serverUrl],
    queryFn: () =>
      Effect.runPromise(
        apiFetch<{ models: ModelInfo[]; defaultModel: string }>(
          MODELS_PATH,
          {},
          serverUrl,
        ),
      ),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSetDefaultModel(serverUrl?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (model: string) =>
      Effect.runPromise(
        apiFetch<{ ok: boolean; model: string; provider: string }>(
          MODEL_DEFAULT_PATH,
          {
            method: "PATCH",
            body: JSON.stringify({ model }),
          },
          serverUrl,
        ),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["models", serverUrl] });
    },
  });
}

// ── Sessions ──
export function useSessions(serverUrl?: string) {
  const cwd = useMemo(() => getCwd(), []);
  dbg.log(`useSessions`, { serverUrl, cwd });
  return useQuery({
    queryKey: ["sessions", serverUrl, cwd],
    queryFn: () =>
      Effect.runPromise(
        apiFetch<{ sessions: SessionInfo[] }>(SESSIONS_PATH, {}, serverUrl),
      ),
  });
}

export function useCreateSession(serverUrl?: string) {
  const qc = useQueryClient();
  const cwd = useMemo(() => getCwd(), []);
  dbg.log(`useCreateSession`, { serverUrl, cwd });
  return useMutation({
    mutationFn: (body: { name?: string; model?: string; provider?: string }) =>
      Effect.runPromise(
        apiFetch<SessionResponse>(
          SESSIONS_PATH,
          { method: "POST", body: JSON.stringify(body) },
          serverUrl,
        ),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions", serverUrl, cwd] });
    },
  });
}

export function useSession(id: string | undefined, serverUrl?: string) {
  return useQuery({
    queryKey: ["session", id, serverUrl],
    queryFn: () =>
      Effect.runPromise(
        apiFetch<SessionResponse>(sessionPath(id!), {}, serverUrl),
      ),
    enabled: !!id,
  });
}

export function useUpdateSession(serverUrl?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      name?: string;
      model?: string;
      provider?: string;
    }) =>
      Effect.runPromise(
        apiFetch<SessionResponse>(
          sessionPath(id),
          {
            method: "PATCH",
            body: JSON.stringify(body),
          },
          serverUrl,
        ),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions", serverUrl] });
    },
  });
}

export function useDeleteSession(serverUrl?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      Effect.runPromise(
        apiFetch<{ ok: boolean }>(
          sessionPath(id),
          { method: "DELETE" },
          serverUrl,
        ),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions", serverUrl] });
    },
  });
}

export function useSessionMessages(id: string | undefined, serverUrl?: string) {
  return useQuery({
    queryKey: ["session-messages", id, serverUrl],
    queryFn: () =>
      Effect.runPromise(
        apiFetch<MessagesResponse>(sessionMessagesPath(id!), {}, serverUrl),
      ),
    enabled: !!id,
  });
}

// ── Skills ──
export function useSkills(serverUrl?: string) {
  const cwd = useMemo(() => getCwd(), []);
  dbg.log(`useSkills`, { serverUrl, cwd });
  return useQuery({
    queryKey: ["skills", serverUrl, cwd],
    queryFn: () =>
      Effect.runPromise(
        apiFetch<{ skills: SkillInfo[] }>(SKILLS_PATH, {}, serverUrl),
      ),
  });
}

export function useSkill(name: string | undefined, serverUrl?: string) {
  return useQuery({
    queryKey: ["skill", name, serverUrl],
    queryFn: () =>
      Effect.runPromise(
        apiFetch<SkillResponse>(skillPath(name!), {}, serverUrl),
      ),
    enabled: !!name,
  });
}

export function useReloadSkills(serverUrl?: string) {
  const qc = useQueryClient();
  const cwd = useMemo(() => getCwd(), []);
  dbg.log(`useReloadSkills`, { serverUrl, cwd });
  return useMutation({
    mutationFn: () =>
      Effect.runPromise(
        apiFetch<{ ok: boolean; message: string }>(
          SKILLS_RELOAD_PATH,
          { method: "POST" },
          serverUrl,
        ),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["skills", serverUrl, cwd] });
    },
  });
}

export function useValidateSkills(serverUrl?: string) {
  const cwd = useMemo(() => getCwd(), []);
  dbg.log(`useValidateSkills`, { serverUrl, cwd });
  return useMutation({
    mutationFn: () =>
      Effect.runPromise(
        apiFetch<{
          results: { name: string; valid: boolean; error: string | null }[];
        }>(SKILLS_VALIDATE_PATH, { method: "POST" }, serverUrl),
      ),
  });
}

// ── Config ──
export function useConfig(serverUrl?: string) {
  return useQuery({
    queryKey: ["config", serverUrl],
    queryFn: () =>
      Effect.runPromise(apiFetch<ServerConfig>(CONFIG_PATH, {}, serverUrl)),
  });
}

export function useUpdateConfig(serverUrl?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (partial: Partial<ServerConfig>) =>
      Effect.runPromise(
        apiFetch<ServerConfig>(
          CONFIG_PATH,
          { method: "PATCH", body: JSON.stringify(partial) },
          serverUrl,
        ),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["config", serverUrl] });
    },
  });
}

// ── Logs ──
export function useLogs(serverUrl?: string) {
  return useQuery({
    queryKey: ["logs", serverUrl],
    queryFn: () =>
      Effect.runPromise(
        apiFetch<{ logs: LogEntry[] }>(LOGS_PATH, {}, serverUrl),
      ),
  });
}

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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useApiBase(serverUrl?: string) {
  return serverUrl;
}

// ── Health ──
export function useHealth(serverUrl?: string) {
  return useQuery({
    queryKey: ["health", serverUrl],
    queryFn: () => apiFetch<HealthStatus>("/health", {}, serverUrl),
    refetchInterval: 30_000,
  });
}

// ── Stats ──
export function useStats(serverUrl?: string) {
  return useQuery({
    queryKey: ["stats", serverUrl],
    queryFn: () => apiFetch<Stats>("/stats", {}, serverUrl),
  });
}

// ── Providers ──
export function useProviders(serverUrl?: string) {
  return useQuery({
    queryKey: ["providers", serverUrl],
    queryFn: () =>
      apiFetch<{ providers: ProviderInfo[]; default: string }>(
        "/providers",
        {},
        serverUrl,
      ),
  });
}

export function useConnectProvider(serverUrl?: string) {
  return useMutation({
    mutationFn: ({ provider, apiKey }: { provider: string; apiKey: string }) =>
      apiFetch<{ ok: boolean; provider: string }>(
        "/providers/connect",
        {
          method: "POST",
          body: JSON.stringify({ provider, apiKey }),
        },
        serverUrl,
      ),
  });
}

export function useDisconnectProvider(serverUrl?: string) {
  return useMutation({
    mutationFn: (provider: string) =>
      apiFetch<{ ok: boolean; provider: string }>(
        `/providers/${encodeURIComponent(provider)}`,
        { method: "DELETE" },
        serverUrl,
      ),
  });
}

export function useSetDefaultProvider(serverUrl?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (provider: string) =>
      apiFetch<{ ok: boolean; provider: string; defaultModel: string }>(
        "/providers/default",
        {
          method: "PATCH",
          body: JSON.stringify({ provider }),
        },
        serverUrl,
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
      apiFetch<{ models: ModelInfo[]; defaultModel: string }>(
        "/models",
        {},
        serverUrl,
      ),
  });
}

export function useSetDefaultModel(serverUrl?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (model: string) =>
      apiFetch<{ ok: boolean; model: string; provider: string }>(
        "/models/default",
        {
          method: "PATCH",
          body: JSON.stringify({ model }),
        },
        serverUrl,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["models", serverUrl] });
    },
  });
}

// ── Sessions ──
export function useSessions(serverUrl?: string) {
  return useQuery({
    queryKey: ["sessions", serverUrl],
    queryFn: () =>
      apiFetch<{ sessions: SessionInfo[] }>("/sessions", {}, serverUrl),
  });
}

export function useCreateSession(serverUrl?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name?: string; model?: string; provider?: string }) =>
      apiFetch<SessionResponse>(
        "/sessions",
        { method: "POST", body: JSON.stringify(body) },
        serverUrl,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions", serverUrl] });
    },
  });
}

export function useSession(id: string | undefined, serverUrl?: string) {
  return useQuery({
    queryKey: ["session", id, serverUrl],
    queryFn: () =>
      apiFetch<SessionResponse>(
        `/sessions/${encodeURIComponent(id!)}`,
        {},
        serverUrl,
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
      apiFetch<SessionResponse>(
        `/sessions/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          body: JSON.stringify(body),
        },
        serverUrl,
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
      apiFetch<{ ok: boolean }>(
        `/sessions/${encodeURIComponent(id)}`,
        { method: "DELETE" },
        serverUrl,
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
      apiFetch<MessagesResponse>(
        `/sessions/${encodeURIComponent(id!)}/messages`,
        {},
        serverUrl,
      ),
    enabled: !!id,
  });
}

// ── Skills ──
export function useSkills(serverUrl?: string) {
  return useQuery({
    queryKey: ["skills", serverUrl],
    queryFn: () => apiFetch<{ skills: SkillInfo[] }>("/skills", {}, serverUrl),
  });
}

export function useSkill(name: string | undefined, serverUrl?: string) {
  return useQuery({
    queryKey: ["skill", name, serverUrl],
    queryFn: () =>
      apiFetch<SkillResponse>(
        `/skills/${encodeURIComponent(name!)}`,
        {},
        serverUrl,
      ),
    enabled: !!name,
  });
}

export function useReloadSkills(serverUrl?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<{ ok: boolean; message: string }>(
        "/skills/reload",
        { method: "POST" },
        serverUrl,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["skills", serverUrl] });
    },
  });
}

export function useValidateSkills(serverUrl?: string) {
  return useMutation({
    mutationFn: () =>
      apiFetch<{
        results: { name: string; valid: boolean; error: string | null }[];
      }>("/skills/validate", { method: "POST" }, serverUrl),
  });
}

// ── Config ──
export function useConfig(serverUrl?: string) {
  return useQuery({
    queryKey: ["config", serverUrl],
    queryFn: () => apiFetch<ServerConfig>("/config", {}, serverUrl),
  });
}

export function useUpdateConfig(serverUrl?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (partial: Partial<ServerConfig>) =>
      apiFetch<ServerConfig>(
        "/config",
        { method: "PATCH", body: JSON.stringify(partial) },
        serverUrl,
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
    queryFn: () => apiFetch<{ logs: LogEntry[] }>("/logs", {}, serverUrl),
  });
}

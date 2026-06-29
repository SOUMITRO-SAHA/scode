export const DEFAULT_PORT = 4100;
export const SERVER_HOST = "127.0.0.1";

export function serverBase(port: number = DEFAULT_PORT): string {
  return `http://${SERVER_HOST}:${port}`;
}

export function apiV1Base(base?: string): string {
  return `${base || serverBase()}/api/v1`;
}

// Legacy endpoint helpers
export function healthUrl(base?: string): string {
  return `${base || serverBase()}/health`;
}

export function processUrl(base?: string): string {
  return `${base || serverBase()}/process`;
}

// API v1 endpoint helpers
export function v1HealthUrl(base?: string): string {
  return `${apiV1Base(base)}/health`;
}

export function v1ChatUrl(base?: string): string {
  return `${apiV1Base(base)}/chat`;
}

export function v1ProcessUrl(base?: string): string {
  return `${apiV1Base(base)}/process`;
}

export function v1ProvidersUrl(base?: string): string {
  return `${apiV1Base(base)}/providers`;
}

export function v1ProviderUrl(provider: string, base?: string): string {
  return `${apiV1Base(base)}/providers/${encodeURIComponent(provider)}`;
}

export function v1ProviderDefaultUrl(base?: string): string {
  return `${apiV1Base(base)}/providers/default`;
}

export function v1ModelsUrl(base?: string): string {
  return `${apiV1Base(base)}/models`;
}

export function v1ModelDefaultUrl(base?: string): string {
  return `${apiV1Base(base)}/models/default`;
}

export function v1SessionsUrl(base?: string): string {
  return `${apiV1Base(base)}/sessions`;
}

export function v1SessionUrl(id: string, base?: string): string {
  return `${apiV1Base(base)}/sessions/${encodeURIComponent(id)}`;
}

export function v1SessionMessagesUrl(id: string, base?: string): string {
  return `${apiV1Base(base)}/sessions/${encodeURIComponent(id)}/messages`;
}

export function v1SkillsUrl(base?: string): string {
  return `${apiV1Base(base)}/skills`;
}

export function v1SkillUrl(name: string, base?: string): string {
  return `${apiV1Base(base)}/skills/${encodeURIComponent(name)}`;
}

export function v1SkillsReloadUrl(base?: string): string {
  return `${apiV1Base(base)}/skills/reload`;
}

export function v1SkillsValidateUrl(base?: string): string {
  return `${apiV1Base(base)}/skills/validate`;
}

export function v1ConfigUrl(base?: string): string {
  return `${apiV1Base(base)}/config`;
}

export function v1LogsUrl(base?: string): string {
  return `${apiV1Base(base)}/logs`;
}

export function v1StatsUrl(base?: string): string {
  return `${apiV1Base(base)}/stats`;
}

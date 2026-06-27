export const HEALTH_PATH = "/health";
export const PROCESS_PATH = "/process";
export const STATS_PATH = "/stats";
export const CONFIG_PATH = "/config";
export const LOGS_PATH = "/logs";
export const CHAT_PATH = "/chat";

export const PROVIDERS_PATH = "/providers";
export const PROVIDER_CONNECT_PATH = "/providers/connect";
export const PROVIDER_DEFAULT_PATH = "/providers/default";

export const MODELS_PATH = "/models";
export const MODEL_DEFAULT_PATH = "/models/default";

export const SESSIONS_PATH = "/sessions";
export const SKILLS_PATH = "/skills";
export const SKILLS_RELOAD_PATH = "/skills/reload";
export const SKILLS_VALIDATE_PATH = "/skills/validate";

export const ACTIVE_CLIENTS_PATH = "/active-clients";

// Parameterized routes
export const providerPath = (provider: string): string =>
  `/providers/${encodeURIComponent(provider)}`;

export const sessionPath = (id: string): string =>
  `/sessions/${encodeURIComponent(id)}`;

export const sessionMessagesPath = (id: string): string =>
  `/sessions/${encodeURIComponent(id)}/messages`;

export const skillPath = (name: string): string =>
  `/skills/${encodeURIComponent(name)}`;

export const activeClientPath = (clientId: string): string =>
  `/active-clients/${encodeURIComponent(clientId)}`;

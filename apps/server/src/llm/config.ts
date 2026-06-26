import { existsSync, readFileSync } from "node:fs";

import { PROVIDER_ENV_MAP, SCODE_AUTH_PATH } from "@scode/shared/constants";

interface AuthEntry {
  apiKey?: string;
}

export interface Auth {
  apiKey: string;
}

function readAuthFile(): Record<string, AuthEntry> {
  if (!existsSync(SCODE_AUTH_PATH)) return {};
  try {
    const raw = readFileSync(SCODE_AUTH_PATH, "utf-8");
    return JSON.parse(raw) as Record<string, AuthEntry>;
  } catch {
    return {};
  }
}

export function resolveApiKey(providerId: string): string {
  const auth = readAuthFile();
  const entry = auth[providerId];
  if (entry?.apiKey) return entry.apiKey;

  const envVar = PROVIDER_ENV_MAP[providerId];
  if (envVar) {
    const envKey = process.env[envVar];
    if (envKey) return envKey;
  }

  throw new Error(
    `No API key found for provider "${providerId}". Set it in ~/.scode/auth.json or the ${envVar ?? "relevant"} environment variable.`,
  );
}

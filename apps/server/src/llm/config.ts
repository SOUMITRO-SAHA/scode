import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

interface AuthEntry {
  apiKey?: string;
}

export interface Auth {
  apiKey: string;
}

const AUTH_PATH = join(homedir(), ".scode", "auth.json");

const PROVIDER_ENV_MAP: Record<string, string> = {
  claude: "ANTHROPIC_API_KEY",
  gemini: "GEMINI_API_KEY",
  deepseek: "DEEPSEEK_API_KEY",
  zai: "ZHIPU_API_KEY",
  minimax: "MINIMAX_API_KEY",
  cohere: "COHERE_API_KEY",
};

function readAuthFile(): Record<string, AuthEntry> {
  if (!existsSync(AUTH_PATH)) return {};
  try {
    const raw = readFileSync(AUTH_PATH, "utf-8");
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

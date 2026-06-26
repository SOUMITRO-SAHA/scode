import { homedir } from "node:os";
import { join } from "node:path";

export const SCODE_DIR = join(homedir(), ".scode");

export function scodePath(...parts: string[]): string {
  return join(SCODE_DIR, ...parts);
}

export const SCODE_CONFIG_PATH = scodePath("config.json");
export const SCODE_AUTH_PATH = scodePath("auth.json");
export const SCODE_DB_PATH = scodePath("scode.db");
export const SCODE_LOGS_DIR = scodePath("logs");

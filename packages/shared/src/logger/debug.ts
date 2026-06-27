import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const LOG_DIR = join(process.cwd(), "logs");
const LOG_FILE = join(LOG_DIR, "debug.log");

function ts(): string {
  return new Date().toISOString();
}

function isEnabled(): boolean {
  return process.env.SCODE_DEBUG === "1" || process.env.SCODE_DEBUG === "true";
}

export class DebugLogger {
  private context: string;

  constructor(context: string) {
    this.context = context;
    if (isEnabled()) {
      mkdirSync(LOG_DIR, { recursive: true });
    }
  }

  log(message: string, data?: unknown): void {
    if (!isEnabled()) return;
    const line = this.format("LOG", message, data);
    this.write(line);
  }

  info(message: string, data?: unknown): void {
    if (!isEnabled()) return;
    const line = this.format("INFO", message, data);
    this.write(line);
  }

  warn(message: string, data?: unknown): void {
    if (!isEnabled()) return;
    const line = this.format("WARN", message, data);
    this.write(line);
  }

  error(message: string, data?: unknown): void {
    if (!isEnabled()) return;
    const line = this.format("ERR", message, data);
    this.write(line);
  }

  private format(level: string, message: string, data?: unknown): string {
    const base = `[${ts()}] [${level}] [${this.context}] ${message}`;
    if (data !== undefined) {
      const json =
        typeof data === "string" ? data : JSON.stringify(data, null, 2);
      return `${base}\n${json}`;
    }
    return base;
  }

  private write(line: string): void {
    try {
      appendFileSync(LOG_FILE, line + "\n", "utf-8");
    } catch {
      // best effort — don't crash the app for logging failures
    }
  }
}

export function initDebugLog(): void {
  if (!isEnabled()) return;
  mkdirSync(LOG_DIR, { recursive: true });
  writeFileSync(
    LOG_FILE,
    `=== scode debug log started at ${ts()} ===\n`,
    "utf-8",
  );
}

import { Context, Effect, Layer } from "effect";
import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { LoggerError } from "../effect/errors";

const LOG_DIR = join(process.cwd(), "logs");
const LOG_FILE = join(LOG_DIR, "debug.log");

function ts(): string {
  return new Date().toISOString();
}

function isEnabled(): boolean {
  return process.env.SCODE_DEBUG === "1" || process.env.SCODE_DEBUG === "true";
}

const writeLine = Effect.fnUntraced(function* (line: string) {
  try {
    appendFileSync(LOG_FILE, line + "\n", "utf-8");
  } catch {
    // best effort
  }
});

const formatLine = Effect.fnUntraced(function* (
  level: string,
  context: string,
  message: string,
  data?: unknown,
) {
  const base = `[${ts()}] [${level}] [${context}] ${message}`;
  if (data !== undefined) {
    const json =
      typeof data === "string" ? data : JSON.stringify(data, null, 2);
    return `${base}\n${json}`;
  }
  return base;
});

export class DebugLogger {
  private context: string;

  constructor(context: string) {
    this.context = context;
    if (isEnabled()) {
      Effect.runSync(
        Effect.sync(() => mkdirSync(LOG_DIR, { recursive: true })),
      );
    }
  }

  log(message: string, data?: unknown): void {
    if (!isEnabled()) return;
    const line = Effect.runSync(formatLine("LOG", this.context, message, data));
    Effect.runSync(writeLine(line));
  }

  info(message: string, data?: unknown): void {
    if (!isEnabled()) return;
    const line = Effect.runSync(
      formatLine("INFO", this.context, message, data),
    );
    Effect.runSync(writeLine(line));
  }

  warn(message: string, data?: unknown): void {
    if (!isEnabled()) return;
    const line = Effect.runSync(
      formatLine("WARN", this.context, message, data),
    );
    Effect.runSync(writeLine(line));
  }

  error(message: string, data?: unknown): void {
    if (!isEnabled()) return;
    const line = Effect.runSync(formatLine("ERR", this.context, message, data));
    Effect.runSync(writeLine(line));
  }
}

export function initDebugLog(): void {
  if (!isEnabled()) return;
  Effect.runSync(
    Effect.sync(() => {
      mkdirSync(LOG_DIR, { recursive: true });
      writeFileSync(
        LOG_FILE,
        `=== scode debug log started at ${ts()} ===\n`,
        "utf-8",
      );
    }),
  );
}

export class DebugLoggerService extends Context.Service<
  DebugLoggerService,
  {
    readonly log: (
      message: string,
      data?: unknown,
    ) => Effect.Effect<void, LoggerError>;
    readonly info: (
      message: string,
      data?: unknown,
    ) => Effect.Effect<void, LoggerError>;
    readonly warn: (
      message: string,
      data?: unknown,
    ) => Effect.Effect<void, LoggerError>;
    readonly error: (
      message: string,
      data?: unknown,
    ) => Effect.Effect<void, LoggerError>;
  }
>()("scode/shared/DebugLogger/Service") {
  static Live = (context: string) =>
    Layer.effect(
      DebugLoggerService,
      Effect.sync(() => {
        const dbg = new DebugLogger(context);
        return DebugLoggerService.of({
          log: (message, data?) => Effect.sync(() => dbg.log(message, data)),
          info: (message, data?) => Effect.sync(() => dbg.info(message, data)),
          warn: (message, data?) => Effect.sync(() => dbg.warn(message, data)),
          error: (message, data?) =>
            Effect.sync(() => dbg.error(message, data)),
        });
      }),
    );
}

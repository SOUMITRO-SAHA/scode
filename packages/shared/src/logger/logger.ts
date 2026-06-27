import { Effect } from "effect";
import {
  mkdirSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import pino from "pino";
import type { Logger as PinoLogger } from "pino";

import type { LogLevel, LoggerOptions } from "./types";
import { dateFromFilename, daysOld } from "./utils";

function ts(): string {
  return new Date().toISOString().slice(11, 23);
}

const LOG_COLOR: Record<string, string> = {
  info: "\x1b[32m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
  debug: "\x1b[36m",
};
const RESET = "\x1b[0m";

const compress = Effect.fnUntraced(function* (fullPath: string) {
  try {
    const content = readFileSync(fullPath);
    writeFileSync(fullPath + ".gz", gzipSync(content));
    unlinkSync(fullPath);
  } catch {
    /* ignore compress errors */
  }
});

const removeFile = Effect.fnUntraced(function* (fullPath: string) {
  try {
    unlinkSync(fullPath);
  } catch {
    /* ignore remove errors */
  }
});

const consoleOut = Effect.fnUntraced(function* (
  level: string,
  msg: string,
  useStdErr: boolean,
) {
  const line = `${LOG_COLOR[level] ?? ""}${level.toUpperCase().slice(0, 3)} ${RESET}${ts()} ${msg}`;
  if (useStdErr || level === "warn" || level === "error") {
    console.error(line);
  } else {
    console.log(line);
  }
});

export const runMaintenanceEffect = Effect.fnUntraced(function* (
  logDir: string,
) {
  let entries: string[];
  try {
    entries = readdirSync(logDir);
  } catch {
    return;
  }

  for (const name of entries) {
    if (name.endsWith(".log") && !name.endsWith(".gz")) {
      const date = dateFromFilename(name);
      if (date && daysOld(date) >= 15) {
        yield* compress(join(logDir, name));
      }
    } else if (name.endsWith(".log.gz")) {
      const date = dateFromFilename(name);
      if (date && daysOld(date) >= 30) {
        yield* removeFile(join(logDir, name));
      }
    }
  }
});

export function runMaintenance(logDir: string): void {
  Effect.runSync(runMaintenanceEffect(logDir));
}

export class Logger {
  private pino: PinoLogger;
  readonly logDir: string;
  private readonly useStdErr: boolean;

  constructor(opts?: LoggerOptions) {
    this.logDir =
      opts?.logDir ??
      process.env.SCODE_LOG_DIR ??
      join(homedir(), ".scode", "logs");
    this.useStdErr = opts?.stderr ?? false;
    Effect.runSync(
      Effect.sync(() => mkdirSync(this.logDir, { recursive: true })),
    );

    this.pino = pino(
      { level: opts?.level ?? "debug" },
      pino.transport({
        target: "pino-roll",
        options: {
          file: join(this.logDir, "scode"),
          frequency: "daily",
          dateFormat: "yyyy-MM-dd",
          mkdir: true,
        },
      }),
    );

    runMaintenance(this.logDir);
  }

  debug(msg: string, data?: unknown): void {
    this.pino.debug(data !== undefined ? { data } : {}, msg);
    Effect.runSync(consoleOut("debug", msg, this.useStdErr));
  }

  info(msg: string, data?: unknown): void {
    this.pino.info(data !== undefined ? { data } : {}, msg);
    Effect.runSync(consoleOut("info", msg, this.useStdErr));
  }

  warn(msg: string, data?: unknown): void {
    this.pino.warn(data !== undefined ? { data } : {}, msg);
    Effect.runSync(consoleOut("warn", msg, this.useStdErr));
  }

  error(msg: string, data?: unknown): void {
    this.pino.error(data !== undefined ? { data } : {}, msg);
    Effect.runSync(consoleOut("error", msg, this.useStdErr));
  }

  close(): void {
    // pino-roll transport worker terminates on process exit
  }
}

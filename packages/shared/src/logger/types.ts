import { Schema } from "effect";

export type LogLevel = "silent" | "error" | "warn" | "info" | "debug";

export const LogLevelSchema: Schema.Schema<LogLevel> = Schema.Literals([
  "silent",
  "error",
  "warn",
  "info",
  "debug",
]);

export const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  silent: -1,
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

export interface LoggerOptions {
  logDir?: string;
  level?: LogLevel;
  stderr?: boolean;
}

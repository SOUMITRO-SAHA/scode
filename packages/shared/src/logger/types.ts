import { Schema } from "effect";

export type LogLevel = "debug" | "info" | "warn" | "error";

export const LogLevelSchema: Schema.Schema<LogLevel> = Schema.Literals([
  "debug",
  "info",
  "warn",
  "error",
]);

export interface LoggerOptions {
  logDir?: string;
  level?: LogLevel;
  stderr?: boolean;
}

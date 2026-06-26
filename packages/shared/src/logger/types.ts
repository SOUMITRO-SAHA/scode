export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LoggerOptions {
  logDir?: string;
  level?: LogLevel;
  stderr?: boolean;
}

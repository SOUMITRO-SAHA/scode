import { readdirSync, readFileSync, writeFileSync, unlinkSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import { homedir } from "node:os"
import { gzipSync } from "node:zlib"
import pino from "pino"
import type { Logger as PinoLogger } from "pino"
import { dateFromFilename, daysOld } from "./utils.js"
import type { LogLevel, LoggerOptions } from "./types.js"

function ts(): string {
  return new Date().toISOString().slice(11, 23)
}

const LOG_COLOR: Record<string, string> = {
  info: "\x1b[32m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
  debug: "\x1b[36m",
}
const RESET = "\x1b[0m"

export class Logger {
  private pino: PinoLogger
  readonly logDir: string
  private readonly useStdErr: boolean

  constructor(opts?: LoggerOptions) {
    this.logDir = opts?.logDir ?? process.env.SCODE_LOG_DIR ?? join(homedir(), ".scode", "logs")
    this.useStdErr = opts?.stderr ?? false
    mkdirSync(this.logDir, { recursive: true })

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
    )

    runMaintenance(this.logDir)
  }

  debug(msg: string, data?: unknown): void {
    this.pino.debug(data !== undefined ? { data } : {}, msg)
    this.consoleOut("debug", msg)
  }

  info(msg: string, data?: unknown): void {
    this.pino.info(data !== undefined ? { data } : {}, msg)
    this.consoleOut("info", msg)
  }

  warn(msg: string, data?: unknown): void {
    this.pino.warn(data !== undefined ? { data } : {}, msg)
    this.consoleOut("warn", msg)
  }

  error(msg: string, data?: unknown): void {
    this.pino.error(data !== undefined ? { data } : {}, msg)
    this.consoleOut("error", msg)
  }

  close(): void {
    // pino-roll transport worker terminates on process exit
  }

  private consoleOut(level: string, msg: string): void {
    const line = `${LOG_COLOR[level]}${level.toUpperCase().slice(0, 3)} ${RESET}${ts()} ${msg}`
    if (this.useStdErr || level === "warn" || level === "error") {
      console.error(line)
    } else {
      console.log(line)
    }
  }
}

export function runMaintenance(logDir: string): void {
  try {
    const entries = readdirSync(logDir, { withFileTypes: true })

    for (const entry of entries) {
      if (entry.name.endsWith(".log") && !entry.name.endsWith(".gz")) {
        const date = dateFromFilename(entry.name)
        if (date && daysOld(date) >= 15) {
          compress(join(logDir, entry.name))
        }
      } else if (entry.name.endsWith(".log.gz")) {
        const date = dateFromFilename(entry.name)
        if (date && daysOld(date) >= 30) {
          try { unlinkSync(join(logDir, entry.name)) } catch { /* ignore */ }
        }
      }
    }
  } catch { /* ignore maintenance errors */ }
}

function compress(fullPath: string): void {
  try {
    const content = readFileSync(fullPath)
    writeFileSync(fullPath + ".gz", gzipSync(content))
    unlinkSync(fullPath)
  } catch { /* ignore compression errors */ }
}

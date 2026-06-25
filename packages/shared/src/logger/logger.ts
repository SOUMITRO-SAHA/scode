import { createWriteStream, readdirSync, readFileSync, writeFileSync, unlinkSync, mkdirSync } from "node:fs"
import type { WriteStream } from "node:fs"
import { join } from "node:path"
import { homedir } from "node:os"
import { gzipSync } from "node:zlib"
import { todayStr, dateFromFilename, daysOld, formatLine } from "./utils.js"
import type { LogLevel, LoggerOptions } from "./types.js"

const LEVEL_RANK: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 }

export class Logger {
  private stream: WriteStream | null = null
  private currentDate = ""
  private readonly logDir: string
  private readonly minLevel: number

  constructor(opts?: LoggerOptions) {
    this.logDir = opts?.logDir ?? join(homedir(), ".scode", "logs")
    this.minLevel = LEVEL_RANK[opts?.level ?? "debug"]
    mkdirSync(this.logDir, { recursive: true })
    this.rotate()
    this.maintenance()
  }

  debug(msg: string, data?: unknown): void { this.write("debug", msg, data) }
  info(msg: string, data?: unknown): void { this.write("info", msg, data) }
  warn(msg: string, data?: unknown): void { this.write("warn", msg, data) }
  error(msg: string, data?: unknown): void { this.write("error", msg, data) }

  close(): void {
    if (this.stream) {
      this.stream.close()
      this.stream = null
    }
  }

  private write(level: LogLevel, msg: string, data?: unknown): void {
    if (LEVEL_RANK[level] < this.minLevel) return

    const line = formatLine(level, msg, data)
    console.log(line)

    try {
      this.ensureStream()
      this.stream!.write(line + "\n")
    } catch {
      console.error(`[logger] Failed to write to log file: ${line}`)
    }
  }

  private ensureStream(): void {
    const today = todayStr()
    if (today !== this.currentDate) {
      this.rotate()
      this.maintenance()
    }
  }

  private rotate(): void {
    this.currentDate = todayStr()
    const path = join(this.logDir, `scode-${this.currentDate}.log`)
    try {
      this.close()
      this.stream = createWriteStream(path, { flags: "a" })
    } catch (err) {
      console.error(`[logger] Failed to open log file: ${path}`, err)
    }
  }

  private maintenance(): void {
    try {
      const entries = readdirSync(this.logDir, { withFileTypes: true })

      for (const entry of entries) {
        if (entry.name.endsWith(".log") && !entry.name.endsWith(".gz")) {
          const date = dateFromFilename(entry.name)
          if (date && daysOld(date) >= 15) {
            this.compress(entry.name)
          }
        } else if (entry.name.endsWith(".log.gz")) {
          const date = dateFromFilename(entry.name)
          if (date && daysOld(date) >= 30) {
            try {
              unlinkSync(join(this.logDir, entry.name))
            } catch { /* ignore */ }
          }
        }
      }
    } catch { /* ignore maintenance errors */ }
  }

  private compress(name: string): void {
    const fullPath = join(this.logDir, name)
    try {
      const content = readFileSync(fullPath)
      const compressed = gzipSync(content)
      writeFileSync(fullPath + ".gz", compressed)
      unlinkSync(fullPath)
    } catch { /* ignore compression errors */ }
  }
}

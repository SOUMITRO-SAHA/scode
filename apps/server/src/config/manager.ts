import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import { homedir } from "node:os"

const CONFIG_PATH = join(homedir(), ".scode", "config.json")

export interface AppConfig {
  theme: "dark" | "light"
  defaultProvider: string
  defaultModel: string
  maxTokens: number
  systemPrompt?: string
}

const DEFAULT_CONFIG: AppConfig = {
  theme: "dark",
  defaultProvider: "claude",
  defaultModel: "claude-sonnet-4-20250515",
  maxTokens: 8192,
}

export class ConfigManager {
  get(): AppConfig {
    try {
      if (!existsSync(CONFIG_PATH)) return { ...DEFAULT_CONFIG }
      const raw = readFileSync(CONFIG_PATH, "utf-8")
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) } as AppConfig
    } catch {
      return { ...DEFAULT_CONFIG }
    }
  }

  update(partial: Partial<AppConfig>): AppConfig {
    const current = this.get()
    const updated = { ...current, ...partial }
    const dir = join(homedir(), ".scode")
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    writeFileSync(CONFIG_PATH, JSON.stringify(updated, null, 2))
    return updated
  }

  set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): AppConfig {
    return this.update({ [key]: value })
  }
}

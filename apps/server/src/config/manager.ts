import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { DEFAULT_APP_CONFIG, SCODE_CONFIG_PATH } from "@scode/shared/constants";
import type { AppConfig } from "@scode/shared/types";

const DEFAULT_CONFIG: AppConfig = { ...DEFAULT_APP_CONFIG };

export class ConfigManager {
  get(): AppConfig {
    try {
      if (!existsSync(SCODE_CONFIG_PATH)) return { ...DEFAULT_CONFIG };
      const raw = readFileSync(SCODE_CONFIG_PATH, "utf-8");
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) } as AppConfig;
    } catch {
      return { ...DEFAULT_CONFIG };
    }
  }

  update(partial: Partial<AppConfig>): AppConfig {
    const current = this.get();
    const updated = { ...current, ...partial };
    const dir = dirname(SCODE_CONFIG_PATH);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(SCODE_CONFIG_PATH, JSON.stringify(updated, null, 2));
    return updated;
  }

  set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): AppConfig {
    return this.update({ [key]: value });
  }
}

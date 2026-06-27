import { describe, expect, it, vi } from "vitest";

import { Effect, Layer } from "effect";

import { ConfigService, ConfigServiceLive } from "../config/service";

import type { AppConfig } from "@scode/shared/types";

vi.mock("../config/manager", () => {
  let current: AppConfig = {
    theme: "dark",
    defaultProvider: "claude",
    defaultModel: "claude-sonnet-4",
    maxTokens: 4096,
  };
  return {
    ConfigManager: class {
      get = vi.fn(() => ({ ...current }));
      update = vi.fn((p: Partial<AppConfig>) => {
        current = { ...current, ...p };
        return { ...current };
      });
      set = vi.fn(<K extends keyof AppConfig>(key: K, value: AppConfig[K]) => {
        current[key] = value;
        return { ...current };
      });
    },
  };
});

const runSync = Effect.runSync;

describe("ConfigService", () => {
  it("is defined and has expected methods", () => {
    expect(ConfigService.key).toBe("ConfigService");
    expect(ConfigService.of).toBeDefined();
  });

  it("provides working get implementation via ConfigServiceLive", () => {
    const layer = ConfigServiceLive;
    const effect = Effect.gen(function* () {
      const svc = yield* ConfigService;
      const cfg = yield* svc.get;
      return cfg;
    });
    const cfg = runSync(Effect.provide(effect, layer));
    expect(cfg.theme).toBe("dark");
    expect(cfg.defaultProvider).toBe("claude");
  });

  it("provides working set implementation", () => {
    const layer = ConfigServiceLive;
    const effect = Effect.gen(function* () {
      const svc = yield* ConfigService;
      yield* svc.set("defaultProvider", "gemini");
      const cfg = yield* svc.get;
      return cfg;
    });
    const cfg = runSync(Effect.provide(effect, layer));
    expect(cfg.defaultProvider).toBe("gemini");
  });

  it("provides working update implementation", () => {
    const layer = ConfigServiceLive;
    const effect = Effect.gen(function* () {
      const svc = yield* ConfigService;
      const updated = yield* svc.update({ maxTokens: 8192 });
      return updated;
    });
    const result = runSync(Effect.provide(effect, layer));
    expect(result.maxTokens).toBe(8192);
  });
});

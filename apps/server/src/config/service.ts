import { Context, Effect, Layer } from "effect";

import { ConfigManager } from "./manager";

import type { AppConfig } from "@scode/shared/types";

export class ConfigService extends Context.Service<
  ConfigService,
  {
    readonly get: Effect.Effect<AppConfig>;
    readonly update: (partial: Partial<AppConfig>) => Effect.Effect<AppConfig>;
    readonly set: <K extends keyof AppConfig>(
      key: K,
      value: AppConfig[K],
    ) => Effect.Effect<AppConfig>;
  }
>()("ConfigService") {}

const configManager = new ConfigManager();

export const ConfigServiceLive = Layer.succeed(
  ConfigService,
  ConfigService.of({
    get: Effect.sync(() => configManager.get()),
    update: (partial) => Effect.sync(() => configManager.update(partial)),
    set: (key, value) => Effect.sync(() => configManager.set(key, value)),
  }),
);

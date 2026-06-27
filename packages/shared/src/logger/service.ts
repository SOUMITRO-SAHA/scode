import { Context, Effect, Layer } from "effect";

import { LoggerError } from "../effect/errors";
import { Logger } from "./logger";
import type { LoggerOptions } from "./types";

export class LoggerService extends Context.Service<
  LoggerService,
  {
    readonly debug: (
      msg: string,
      data?: unknown,
    ) => Effect.Effect<void, LoggerError>;
    readonly info: (
      msg: string,
      data?: unknown,
    ) => Effect.Effect<void, LoggerError>;
    readonly warn: (
      msg: string,
      data?: unknown,
    ) => Effect.Effect<void, LoggerError>;
    readonly error: (
      msg: string,
      data?: unknown,
    ) => Effect.Effect<void, LoggerError>;
    readonly close: Effect.Effect<void, LoggerError>;
  }
>()("scode/shared/Logger/Service") {
  static Live = (opts?: LoggerOptions) =>
    Layer.effect(
      LoggerService,
      Effect.sync(() => {
        const logger = new Logger(opts);
        return LoggerService.of({
          debug: (msg, data?) => Effect.sync(() => logger.debug(msg, data)),
          info: (msg, data?) => Effect.sync(() => logger.info(msg, data)),
          warn: (msg, data?) => Effect.sync(() => logger.warn(msg, data)),
          error: (msg, data?) => Effect.sync(() => logger.error(msg, data)),
          close: Effect.sync(() => logger.close()),
        });
      }),
    );
}

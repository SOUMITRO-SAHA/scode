import { Context, Effect, Layer } from "effect";

import { DebugLogger, Logger } from "@scode/shared/logger";

export class LoggerService extends Context.Service<
  LoggerService,
  {
    readonly info: (msg: string) => Effect.Effect<void>;
    readonly error: (msg: string) => Effect.Effect<void>;
    readonly warn: (msg: string) => Effect.Effect<void>;
    readonly debug: (msg: string) => Effect.Effect<void>;
    readonly close: Effect.Effect<void>;
  }
>()("LoggerService") {}

const logger = new Logger();
const dbg = new DebugLogger("server:handler");

export const LoggerServiceLive = Layer.succeed(
  LoggerService,
  LoggerService.of({
    info: (msg) => Effect.sync(() => logger.info(msg)),
    error: (msg) => Effect.sync(() => logger.error(msg)),
    warn: (msg) => Effect.sync(() => logger.warn(msg)),
    debug: (msg) => Effect.sync(() => logger.debug(msg)),
    close: Effect.sync(() => logger.close()),
  }),
);

export { logger, dbg };

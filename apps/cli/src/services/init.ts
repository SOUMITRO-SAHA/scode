import { Data } from "effect";
import * as Effect from "effect/Effect";

import { CliConfig } from "./config";
import { ensureServer, registerActiveClient } from "./daemon";
import { setClientId } from "./shutdown";

import { Logger } from "@scode/shared/logger";

const logger = new Logger({ stderr: true });

export interface InitResult {
  readonly serverUrl: string;
}

export class InitError extends Data.TaggedError("InitError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export const initializeApp = Effect.gen(function* () {
  const config = yield* CliConfig;

  logger.debug("Platform initialized", {
    port: config.port,
    maxPolls: config.maxPolls,
  });

  const serverUrl = yield* Effect.tryPromise({
    try: () => ensureServer(),
    catch: (cause) =>
      new InitError({ message: "Failed to ensure server", cause }),
  });

  const id = yield* Effect.tryPromise({
    try: () => registerActiveClient(),
    catch: (cause) =>
      new InitError({ message: "Failed to register client", cause }),
  });

  if (id) {
    setClientId(id);
    logger.debug(`Registered client: ${id}`);
  } else {
    logger.warn("Client registration failed — shutdown will skip unregister");
  }

  return { serverUrl };
});

import { Data, Effect } from "effect";

import { CliConfig } from "./config";
import { ensureServer, registerActiveClient } from "./daemon";
import { setClientId } from "./shutdown";

import { Logger } from "@scode/shared/logger";

const logger = new Logger({ stderr: true });

export interface BootstrapResult {
  readonly serverUrl: string;
}

export class BootstrapError extends Data.TaggedError("BootstrapError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export const bootstrap = Effect.gen(function* () {
  const config = yield* CliConfig;

  const serverUrl = yield* ensureServer;

  const id = yield* registerActiveClient;

  if (id) {
    setClientId(id);
  } else {
    logger.warn("Client registration failed — shutdown will skip unregister");
  }

  return { serverUrl } satisfies BootstrapResult;
});

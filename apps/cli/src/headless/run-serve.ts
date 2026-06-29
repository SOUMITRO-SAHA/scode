import { Data } from "effect";
import * as Effect from "effect/Effect";

import { spawnServerProcess, waitForServer } from "@/services/daemon";
import { DEFAULT_PORT } from "@scode/shared/constants";
import { Logger } from "@scode/shared/logger";

const logger = new Logger({ stderr: true });

export class ServeError extends Data.TaggedError("ServeError")<{
  readonly message: string;
}> {}

const waitForSigint: Effect.Effect<void> = Effect.promise(
  () =>
    new Promise<void>((resolve) => {
      process.on("SIGINT", () => resolve());
    }),
);

export const runServe: Effect.Effect<void, ServeError> = Effect.gen(
  function* () {
    logger.info(`Starting server on port ${DEFAULT_PORT}…`);

    const proc = spawnServerProcess();

    yield* Effect.sync(() => {
      proc.on("exit", (code) => {
        process.exit(code ?? 0);
      });
      proc.ref();
    });

    const ok = yield* waitForServer;
    if (!ok) {
      return yield* Effect.fail(
        new ServeError({
          message: `Server on port ${DEFAULT_PORT} did not become healthy`,
        }),
      );
    }

    logger.info(
      `Server ready on http://127.0.0.1:${DEFAULT_PORT} — press Ctrl+C to stop`,
    );

    yield* waitForSigint;
    process.exit(0);
  },
);

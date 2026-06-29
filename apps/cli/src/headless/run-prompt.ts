import { Data } from "effect";
import * as Effect from "effect/Effect";
import { stdout } from "node:process";

import { sendPrompt } from "@/services/client";
import type { StreamError } from "@/services/errors";
import { gracefulShutdown } from "@/services/shutdown";
import { Logger } from "@scode/shared/logger";
import { getCwd } from "@scode/shared/utils";

const logger = new Logger({ stderr: true });

export class PromptRunError extends Data.TaggedError("PromptRunError")<{
  readonly message: string;
}> {}

export const runPrompt = (
  text: string,
  serverUrl: string,
  model?: string,
): Effect.Effect<void, PromptRunError> =>
  Effect.gen(function* () {
    const cwd = getCwd();
    logger.info(`Single-shot mode: "${text.slice(0, 60)}..."`);
    logger.info(`CWD: ${cwd}`);
    if (model) logger.info(`Using model: ${model}`);

    yield* Effect.catchIf(
      sendPrompt(
        text,
        serverUrl,
        (token) => {
          stdout.write(token);
        },
        model,
        undefined,
        cwd,
      ),
      (e: StreamError): e is StreamError => true,
      (cause) => Effect.fail(new PromptRunError({ message: cause.message })),
    );

    stdout.write("\n");
    yield* gracefulShutdown(0, serverUrl);
  });

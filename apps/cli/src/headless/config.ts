import { Data } from "effect";
import * as Effect from "effect/Effect";

import type { CliArgs, HeadlessMode } from "./types";

export class ArgParseError extends Data.TaggedError("ArgParseError")<{
  readonly message: string;
}> {}

export const parseArgs = Effect.gen(function* () {
  const args = process.argv.slice(2);
  const promptIndex = args.indexOf("--prompt");
  const modelIndex = args.indexOf("--model");
  const model = modelIndex !== -1 ? args[modelIndex + 1] : undefined;

  if (promptIndex !== -1) {
    const text = args[promptIndex + 1];
    if (!text) {
      return yield* Effect.fail(
        new ArgParseError({ message: "--prompt requires a text argument" }),
      );
    }
    const mode: HeadlessMode = { kind: "prompt", text, model };
    return { mode } satisfies CliArgs;
  }

  return { mode: { kind: "none" } } satisfies CliArgs;
});

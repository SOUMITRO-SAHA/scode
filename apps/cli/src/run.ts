import { Data, Effect } from "effect";

import { startTui } from "./app";
import { parseArgs } from "./headless/config";
import { runHeadless } from "./headless/run";
import { runRepl } from "./headless/run-repl";
import { bootstrap } from "./services/bootstrap";
import { CliConfig } from "./services/config";

export class CliError extends Data.TaggedError("CliError")<{
  readonly message: string;
}> {}

export const runCli = Effect.gen(function* () {
  const args = yield* parseArgs;

  if (args.mode.kind !== "none") {
    const { serverUrl } = yield* Effect.provide(bootstrap, CliConfig.Live);
    yield* runHeadless;
    return;
  }

  const { serverUrl } = yield* Effect.provide(bootstrap, CliConfig.Live);

  const tuiOk = yield* Effect.promise(() => startTui(serverUrl));
  if (!tuiOk) {
    yield* runRepl(serverUrl);
  }
});

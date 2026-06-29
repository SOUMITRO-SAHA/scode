import * as Effect from "effect/Effect";

import { parseArgs } from "./config";
import { runPrompt } from "./run-prompt";
import { runRepl } from "./run-repl";
import { runServe } from "./run-serve";
import type { HeadlessMode } from "./types";

import { bootstrap } from "@/services/bootstrap";
import { CliConfig } from "@/services/config";
import { Logger } from "@scode/shared/logger";

function getModel(mode: HeadlessMode): string | undefined {
  return "model" in mode ? mode.model : undefined;
}

export const runHeadless = Effect.gen(function* () {
  const args = yield* parseArgs;
  if (args.mode.kind === "none") return false;

  if (args.mode.kind === "serve") {
    yield* runServe;
    return true;
  }

  if (args.mode.kind === "repl" && !args.logEnabled) {
    Logger.setLevel("silent");
    process.env.SCODE_LOG_LEVEL = "silent";
  }

  const { serverUrl } = yield* Effect.provide(bootstrap, CliConfig.Live);

  if (args.mode.kind === "prompt") {
    yield* runPrompt(args.mode.text, serverUrl, args.mode.model);
    return true;
  }

  const model = getModel(args.mode);
  yield* runRepl(serverUrl, model);
  return true;
});

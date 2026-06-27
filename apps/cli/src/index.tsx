import * as Effect from "effect/Effect";

import { startTui } from "@/app";
import { parseArgs, runHeadless, runRepl } from "@/headless/index";
import { bootstrap } from "@/services/bootstrap";
import { CliConfig } from "@/services/config";
import { gracefulShutdown } from "@/services/shutdown";
import { Logger } from "@scode/shared/logger";
import { errorMessage } from "@scode/shared/utils";

const logger = new Logger({ stderr: true });

async function main() {
  try {
    const headlessHandled = await Effect.runPromise(runHeadless);
    if (headlessHandled) return;
  } catch (err) {
    logger.error(`Headless mode failed: ${(err as Error).message}`);
    process.exit(1);
  }

  const args = Effect.runSync(parseArgs);
  const model = args.mode.kind !== "none" ? args.mode.model : undefined;

  let serverUrl: string;
  try {
    const result = await Effect.runPromise(
      Effect.provide(bootstrap, CliConfig.Live),
    );
    serverUrl = result.serverUrl;
  } catch (err) {
    logger.error(
      `Failed to connect to server: ${Effect.runSync(errorMessage(err))}`,
    );
    process.exit(1);
  }

  const tuiOk = await startTui(serverUrl, model);
  if (tuiOk) return;

  logger.warn(
    "TUI unavailable — falling back to REPL mode. Try resetting your terminal if this persists.",
  );
  await Effect.runPromise(runRepl(serverUrl, model));
}

main().catch((err) => {
  logger.error(`Fatal: ${(err as Error).message}`);
  if (err instanceof Error && err.stack) {
    logger.error(err.stack);
  }
  void Effect.runPromise(gracefulShutdown(1));
});

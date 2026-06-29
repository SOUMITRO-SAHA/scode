import * as Effect from "effect/effect";

import { runCli } from "./run";

import { gracefulShutdown } from "@/services/shutdown";

runCli().catch((err) => {
  console.error(`Fatal: ${(err as Error).message}`);
  if (err instanceof Error && err.stack) {
    console.error(err.stack);
  }
  void Effect.runPromise(gracefulShutdown(1));
});

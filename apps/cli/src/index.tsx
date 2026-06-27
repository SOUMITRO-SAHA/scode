import * as Effect from "effect/Effect";

import { App } from "@/app";
import { ErrorBoundary } from "@/components/error/index";
import { parseArgs, runRepl } from "@/headless/index";
import { runHeadless } from "@/headless/run";
import { CliConfig } from "@/services/config";
import { initializeApp } from "@/services/init";
import { gracefulShutdown, setRendererCleanup } from "@/services/shutdown";
import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { Logger, initDebugLog } from "@scode/shared/logger";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

initDebugLog();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 10_000, refetchOnWindowFocus: false },
  },
});

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
      Effect.provide(initializeApp, CliConfig.Live),
    );
    serverUrl = result.serverUrl;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(`Failed to connect to server: ${msg}`);
    process.exit(1);
  }

  const tuiOk = await tryTui(serverUrl, model);
  if (tuiOk) return;

  logger.warn(
    "TUI unavailable — falling back to REPL mode. Try resetting your terminal if this persists.",
  );
  await Effect.runPromise(runRepl(serverUrl, model));
}

async function tryTui(serverUrl: string, model?: string): Promise<boolean> {
  try {
    const renderer = await createCliRenderer({
      exitOnCtrlC: false,
      targetFps: 30,
    });

    setRendererCleanup(() => renderer.destroy());

    process.on("SIGINT", () => {
      void Effect.runPromise(gracefulShutdown(0, serverUrl));
    });

    process.on("uncaughtException", (err) => {
      logger.error(`Uncaught exception: ${err.message}`);
      void Effect.runPromise(gracefulShutdown(1, serverUrl));
    });

    process.on("unhandledRejection", (reason) => {
      const message = reason instanceof Error ? reason.message : String(reason);
      logger.error(`Unhandled rejection: ${message}`);
      void Effect.runPromise(gracefulShutdown(1, serverUrl));
    });

    const handleExit = () => {
      void Effect.runPromise(gracefulShutdown(0, serverUrl));
    };

    createRoot(renderer).render(
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <App serverUrl={serverUrl} model={model} onExit={handleExit} />
        </ErrorBoundary>
      </QueryClientProvider>,
    );
    return true;
  } catch (err) {
    logger.debug(
      `TUI init failed: ${err instanceof Error ? err.message : String(err)}`,
    );
    return false;
  }
}

main().catch((err) => {
  logger.error(`Fatal: ${(err as Error).message}`);
  if (err instanceof Error && err.stack) {
    logger.error(err.stack);
  }
  void Effect.runPromise(gracefulShutdown(1));
});

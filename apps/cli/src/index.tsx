import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline";

import { App } from "./app";
import { ErrorBoundary } from "./components/error-boundary";
import { sendPrompt } from "./services/client";
import { ensureServer, registerActiveClient } from "./services/daemon";
import {
  gracefulShutdown,
  initShutdown,
  setClientId,
} from "./services/shutdown";

import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { Logger } from "@scode/shared/logger";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 10_000, refetchOnWindowFocus: false },
  },
});

const logger = new Logger({ stderr: true });

async function main() {
  const args = process.argv.slice(2);
  const promptIndex = args.indexOf("--prompt");
  const directPrompt = promptIndex !== -1 ? args[promptIndex + 1] : null;
  const modelIndex = args.indexOf("--model");
  const model = modelIndex !== -1 ? args[modelIndex + 1] : undefined;

  let serverUrl: string;
  try {
    serverUrl = await ensureServer();
  } catch (err) {
    logger.error(`Failed to connect to server: ${(err as Error).message}`);
    process.exit(1);
  }

  initShutdown(serverUrl);

  const id = await registerActiveClient();
  if (id) setClientId(id);

  if (directPrompt) {
    logger.info(`Single-shot mode: "${directPrompt.slice(0, 60)}..."`);
    if (model) logger.info(`Using model: ${model}`);
    try {
      await sendPrompt(
        directPrompt,
        serverUrl,
        (token) => {
          stdout.write(token);
        },
        model,
      );
    } catch (err) {
      logger.error(`Prompt failed: ${(err as Error).message}`);
      await gracefulShutdown(1);
      return;
    }
    stdout.write("\n");
    await gracefulShutdown(0);
    return;
  }

  const tuiOk = await tryTui(serverUrl, model);
  if (tuiOk) return;

  logger.warn(
    "TUI unavailable — falling back to REPL mode. Try resetting your terminal if this persists.",
  );
  await repl(serverUrl, model);
}

async function tryTui(serverUrl: string, model?: string): Promise<boolean> {
  try {
    const renderer = await createCliRenderer({
      exitOnCtrlC: false,
      targetFps: 30,
    });

    initShutdown(serverUrl, () => renderer.destroy());

    process.on("SIGINT", () => {
      void gracefulShutdown(0);
    });

    process.on("uncaughtException", (err) => {
      logger.error(`Uncaught exception: ${err.message}`);
      void gracefulShutdown(1);
    });

    process.on("unhandledRejection", (reason) => {
      const message = reason instanceof Error ? reason.message : String(reason);
      logger.error(`Unhandled rejection: ${message}`);
      void gracefulShutdown(1);
    });

    const handleExit = () => {
      void gracefulShutdown(0);
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

async function repl(serverUrl: string, model?: string): Promise<void> {
  console.log("scode REPL — type your prompt, or /q to quit");
  const rl = createInterface({ input: stdin, output: stdout, terminal: true });

  rl.on("line", async (line) => {
    const input = line.trim();
    if (!input) {
      rl.prompt();
      return;
    }
    if (input === "/q") {
      rl.close();
      return;
    }
    console.log();
    await sendPrompt(input, serverUrl, (token) => stdout.write(token), model);
    console.log("\n");
    rl.prompt();
  });

  rl.on("close", () => {
    void gracefulShutdown(0);
  });

  rl.prompt();
}

main().catch((err) => {
  logger.error(`Fatal: ${(err as Error).message}`);
  if (err instanceof Error && err.stack) {
    logger.error(err.stack);
  }
  void gracefulShutdown(1);
});

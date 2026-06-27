import * as Effect from "effect/Effect";
import * as MutableRef from "effect/MutableRef";
import { type ChildProcess, spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { ServerNotFoundError } from "./errors";

import {
  DEFAULT_PORT,
  MAX_POLLS,
  POLL_INTERVAL,
  serverBase,
} from "@scode/shared/constants";
import { Logger } from "@scode/shared/logger";
import type { RegisterClientResponse } from "@scode/shared/types";
import { apiFetch } from "@scode/shared/utils";

const logger = new Logger({ stderr: true });
const serverProcessRef = MutableRef.make<ChildProcess | null>(null);
const baseUrl = serverBase();
const healthCheckUrl = `${baseUrl}/health`;

function resolveServerEntry(): string {
  const cliSrc = dirname(fileURLToPath(import.meta.url));
  return resolve(cliSrc, "../../../server/src/index.ts");
}

const healthCheck = Effect.tryPromise({
  try: () => apiFetch("/health", {}, baseUrl).then(() => true),
  catch: () => false,
}).pipe(Effect.catchCause(() => Effect.succeed(false)));

export const findServer: Effect.Effect<string | null> = Effect.gen(
  function* () {
    const ok = yield* healthCheck;
    if (ok) {
      logger.debug(`Found existing server at ${healthCheckUrl}`);
      return baseUrl;
    }
    return null;
  },
);

export const startServer: Effect.Effect<string, ServerNotFoundError> =
  Effect.gen(function* () {
    const entry = resolveServerEntry();
    logger.info(`Starting server from ${entry}`);

    const proc = spawn("npx", ["tsx", entry, `--port=${DEFAULT_PORT}`], {
      stdio: ["ignore", "pipe", "pipe"],
      detached: true,
    });

    MutableRef.set(serverProcessRef, proc);

    proc.stdout?.on("data", (data: Buffer) => {
      const msg = data.toString().trim();
      if (msg) console.error("[server]", msg);
    });

    proc.stderr?.on("data", (data: Buffer) => {
      const msg = data.toString().trim();
      if (msg) console.error("[server]", msg);
    });

    proc.on("exit", (code) => {
      if (code !== 0) logger.warn(`Server exited with code ${code}`);
      MutableRef.set(serverProcessRef, null);
    });

    proc.unref();

    logger.debug(`Polling server health at ${healthCheckUrl}`);
    for (let i = 0; i < MAX_POLLS; i++) {
      const ok = yield* healthCheck;
      if (ok) {
        logger.info(`Server ready at ${baseUrl}`);
        return baseUrl;
      }
      yield* Effect.sleep(`${POLL_INTERVAL} millis`);
    }

    return yield* Effect.fail(
      new ServerNotFoundError({
        port: DEFAULT_PORT,
        attempts: MAX_POLLS,
      }),
    );
  });

export const stopServer: Effect.Effect<void> = Effect.sync(() => {
  const proc = MutableRef.get(serverProcessRef);
  if (proc !== null) {
    logger.info("Stopping server");
    proc.kill("SIGTERM");
    MutableRef.set(serverProcessRef, null);
  }
});

export const ensureServer: Effect.Effect<string, ServerNotFoundError> =
  Effect.gen(function* () {
    const existing = yield* findServer;
    if (existing !== null) return existing;
    return yield* startServer;
  });

export const registerActiveClient: Effect.Effect<string | null> =
  Effect.promise(() =>
    apiFetch<RegisterClientResponse>(
      "/active-clients",
      { method: "POST" },
      baseUrl,
    )
      .then((r) => r.clientId)
      .catch(() => null),
  );

import * as Effect from "effect/Effect";
import * as MutableRef from "effect/MutableRef";
import { type ChildProcess, spawn } from "node:child_process";
import { existsSync } from "node:fs";
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

function isSeaBinary(): boolean {
  return !process.argv[1];
}

function resolveServerEntry(): string {
  const cliDir = dirname(fileURLToPath(import.meta.url));
  if (cliDir.includes("dist")) {
    const bundled = resolve(cliDir, "../../../server/dist/server/index.mjs");
    if (existsSync(bundled)) return bundled;
  }
  return resolve(cliDir, "../../../server/src/index.ts");
}

function resolveTsxEntry(): string | null {
  const cliDir = dirname(fileURLToPath(import.meta.url));
  const candidate = resolve(
    cliDir,
    "../../../../node_modules/tsx/dist/cli.mjs",
  );
  if (existsSync(candidate)) return candidate;
  return null;
}

const healthCheck = Effect.isSuccess(apiFetch<unknown>("/health", {}, baseUrl));

export const findServer: Effect.Effect<string | null> = Effect.gen(
  function* () {
    const ok = yield* healthCheck;
    if (ok) {
      return baseUrl;
    }
    return null;
  },
);

export function spawnServerProcess(): ChildProcess {
  let command: string;
  let args: string[];

  if (isSeaBinary()) {
    command = process.execPath;
    args = ["serve", `--port=${DEFAULT_PORT}`];
    logger.info("Starting server (self-spawn)");
  } else {
    const entry = resolveServerEntry();
    logger.info(`Starting server from ${entry}`);

    const isBundled = entry.endsWith(".mjs");
    if (isBundled) {
      command = "node";
      args = [entry, `--port=${DEFAULT_PORT}`];
    } else {
      const tsxEntry = resolveTsxEntry();
      if (tsxEntry) {
        command = "node";
        args = [tsxEntry, entry, `--port=${DEFAULT_PORT}`];
      } else {
        command = "npx";
        args = ["tsx", entry, `--port=${DEFAULT_PORT}`];
      }
    }
  }

  const proc = spawn(command, args, {
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
    env: { ...process.env },
  });

  MutableRef.set(serverProcessRef, proc);

  const quietServer =
    process.env.SCODE_LOG_LEVEL === "silent" ||
    process.env.SCODE_LOG_LEVEL === "error";

  proc.stdout?.on("data", (data: Buffer) => {
    const msg = data.toString().trim();
    if (msg && !quietServer) console.error("[server]", msg);
  });

  proc.stderr?.on("data", (data: Buffer) => {
    const msg = data.toString().trim();
    if (msg && !quietServer) console.error("[server]", msg);
  });

  proc.on("error", (err) => {
    logger.error(`Server process failed to start: ${err.message}`);
    MutableRef.set(serverProcessRef, null);
  });

  proc.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      logger.warn(`Server exited with code ${code}`);
    }
    MutableRef.set(serverProcessRef, null);
  });

  proc.unref();
  return proc;
}

export const waitForServer: Effect.Effect<boolean> = Effect.gen(function* () {
  for (let i = 0; i < MAX_POLLS; i++) {
    const ok = yield* healthCheck;
    if (ok) return true;
    yield* Effect.sleep(`${POLL_INTERVAL} millis`);
  }
  return false;
});

export const startServer: Effect.Effect<string, ServerNotFoundError> =
  Effect.gen(function* () {
    spawnServerProcess();
    const ok = yield* waitForServer;
    if (ok) {
      logger.info(`Server ready at ${baseUrl}`);
      return baseUrl;
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
  apiFetch<RegisterClientResponse>(
    "/active-clients",
    {
      method: "POST",
      body: JSON.stringify({ cwd: process.cwd() }),
    },
    baseUrl,
  ).pipe(
    Effect.map((r) => r.clientId),
    Effect.catch(() => Effect.succeed(null)),
    Effect.catchCause(() => Effect.succeed(null)),
  );

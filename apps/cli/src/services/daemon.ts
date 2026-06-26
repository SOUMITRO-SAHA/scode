import { type ChildProcess, spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  DEFAULT_PORT,
  MAX_POLLS,
  POLL_INTERVAL,
  healthUrl,
  serverBase,
} from "@scode/shared/constants";
import { Logger } from "@scode/shared/logger";

const logger = new Logger({ stderr: true });
let serverProcess: ChildProcess | null = null;
const healthCheckUrl = healthUrl();
const baseUrl = serverBase();

async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch(healthCheckUrl, {
      signal: AbortSignal.timeout(1500),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function findServer(): Promise<string | null> {
  const ok = await healthCheck();
  if (ok) logger.debug(`Found existing server at ${healthCheckUrl}`);
  return ok ? baseUrl : null;
}

function resolveServerEntry(): string {
  const cliSrc = dirname(fileURLToPath(import.meta.url));
  return resolve(cliSrc, "../../../server/src/index.ts");
}

export async function startServer(): Promise<string> {
  const entry = resolveServerEntry();
  logger.info(`Starting server from ${entry}`);

  serverProcess = spawn("npx", ["tsx", entry, `--port=${DEFAULT_PORT}`], {
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  });

  serverProcess.stdout?.on("data", (data: Buffer) => {
    const msg = data.toString().trim();
    if (msg) console.error("[server]", msg);
  });

  serverProcess.stderr?.on("data", (data: Buffer) => {
    const msg = data.toString().trim();
    if (msg) console.error("[server]", msg);
  });

  serverProcess.on("exit", (code) => {
    if (code !== 0) logger.warn(`Server exited with code ${code}`);
    serverProcess = null;
  });

  serverProcess.unref();

  logger.debug(`Polling server health at ${healthCheckUrl}`);
  for (let i = 0; i < MAX_POLLS; i++) {
    const ok = await healthCheck();
    if (ok) {
      logger.info(`Server ready at ${baseUrl}`);
      return baseUrl;
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL));
  }

  throw new Error("Server failed to start within timeout");
}

export function stopServer(): void {
  if (serverProcess) {
    logger.info("Stopping server");
    serverProcess.kill("SIGTERM");
    serverProcess = null;
  }
}

export async function ensureServer(): Promise<string> {
  const existing = await findServer();
  if (existing) return existing;
  return startServer();
}

import { stopServer } from "./daemon";

import { Logger } from "@scode/shared/logger";
import type { UnregisterClientResponse } from "@scode/shared/types";
import { apiFetch } from "@scode/shared/utils";

const logger = new Logger({ stderr: true });

let clientId: string | null = null;
let rendererDestroy: (() => void) | null = null;

export function setRendererCleanup(destroy: () => void) {
  rendererDestroy = destroy;
}

export function setClientId(id: string | null) {
  clientId = id;
}

export function getClientId(): string | null {
  return clientId;
}

export async function gracefulShutdown(
  exitCode: number = 0,
  baseUrl?: string,
): Promise<void> {
  if (clientId && baseUrl) {
    const id = clientId;
    clientId = null;
    try {
      const data = await apiFetch<UnregisterClientResponse>(
        `/active-clients/${encodeURIComponent(id)}`,
        { method: "DELETE" },
        baseUrl,
      );
      if (data.wasLast) {
        logger.info("Last client — shutting down server");
        stopServer();
      }
    } catch {
      /* server may already be down */
    }
  }

  rendererDestroy?.();
  logger.close();
  process.exit(exitCode);
}

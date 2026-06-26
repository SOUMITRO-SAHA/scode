import { stopServer } from "./daemon";

import { Logger } from "@scode/shared/logger";
import type { UnregisterClientResponse } from "@scode/shared/types";

const logger = new Logger({ stderr: true });

let clientId: string | null = null;
let apiBaseUrl = "";
let rendererDestroy: (() => void) | null = null;

export function setApiBaseUrl(baseUrl: string) {
  apiBaseUrl = `${baseUrl}/api/v1`;
}

export function setRendererCleanup(destroy: () => void) {
  rendererDestroy = destroy;
}

export function setClientId(id: string | null) {
  clientId = id;
}

export function getClientId(): string | null {
  return clientId;
}

export async function gracefulShutdown(exitCode: number = 0): Promise<void> {
  if (clientId) {
    const id = clientId;
    clientId = null;
    try {
      const res = await fetch(
        `${apiBaseUrl}/active-clients/${encodeURIComponent(id)}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        const data = (await res.json()) as UnregisterClientResponse;
        if (data.wasLast) {
          logger.info("Last client — shutting down server");
          stopServer();
        }
      }
    } catch {
      /* server may already be down */
    }
  }

  rendererDestroy?.();
  logger.close();
  process.exit(exitCode);
}

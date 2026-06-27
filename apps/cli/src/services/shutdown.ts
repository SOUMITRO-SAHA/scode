import * as Effect from "effect/Effect";
import * as MutableRef from "effect/MutableRef";

import { stopServer } from "./daemon";

import { Logger } from "@scode/shared/logger";
import type { UnregisterClientResponse } from "@scode/shared/types";
import { apiFetch } from "@scode/shared/utils";

const logger = new Logger({ stderr: true });

const clientIdRef = MutableRef.make<string | null>(null);
const rendererDestroyRef = MutableRef.make<(() => void) | null>(null);

export function setRendererCleanup(destroy: (() => void) | null): void {
  MutableRef.set(rendererDestroyRef, destroy);
}

export function setClientId(id: string | null): void {
  MutableRef.set(clientIdRef, id);
}

export function getClientId(): string | null {
  return MutableRef.get(clientIdRef);
}

export const gracefulShutdown = (
  exitCode: number = 0,
  baseUrl?: string,
): Effect.Effect<void> =>
  Effect.gen(function* () {
    const id = MutableRef.get(clientIdRef);
    if (id !== null && baseUrl) {
      MutableRef.set(clientIdRef, null);
      const data = yield* Effect.promise<UnregisterClientResponse | undefined>(
        () =>
          apiFetch<UnregisterClientResponse>(
            `/active-clients/${encodeURIComponent(id)}`,
            { method: "DELETE" },
            baseUrl,
          ).catch(() => undefined),
      );
      if (data && data.wasLast) {
        logger.info("Last client — shutting down server");
        yield* stopServer;
      }
    }

    const destroy = MutableRef.get(rendererDestroyRef);
    if (destroy) destroy();
    logger.close();
    process.exit(exitCode);
  });

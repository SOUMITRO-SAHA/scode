import { ensureServer, registerActiveClient } from "./daemon";
import { initShutdown, setClientId } from "./shutdown";

import { Logger } from "@scode/shared/logger";

const logger = new Logger({ stderr: true });

export interface InitResult {
  serverUrl: string;
}

export async function initializeApp(): Promise<InitResult> {
  const serverUrl = await ensureServer();

  initShutdown(serverUrl);

  const id = await registerActiveClient();
  if (id) {
    setClientId(id);
    logger.debug(`Registered client: ${id}`);
  } else {
    logger.warn("Client registration failed — shutdown will skip unregister");
  }

  return { serverUrl };
}

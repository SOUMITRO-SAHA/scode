import { Context, Effect, Layer } from "effect";

import type { ActiveClient } from "./active-clients";
import { ActiveClientManager } from "./active-clients";

export class ActiveClientService extends Context.Service<
  ActiveClientService,
  {
    readonly register: (clientId?: string) => string;
    readonly unregister: (clientId: string) => {
      existed: boolean;
      count: number;
    };
    readonly getCount: () => number;
    readonly getClients: () => ActiveClient[];
  }
>()("ActiveClientService") {}

const activeClientManager = new ActiveClientManager();

export const ActiveClientServiceLive = Layer.succeed(
  ActiveClientService,
  ActiveClientService.of({
    register: (clientId) => activeClientManager.register(clientId),
    unregister: (clientId) => activeClientManager.unregister(clientId),
    getCount: () => activeClientManager.getCount(),
    getClients: () => activeClientManager.getClients(),
  }),
);

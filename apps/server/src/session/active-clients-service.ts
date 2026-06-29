import { Context, Effect, Layer } from "effect";

import type { ActiveClient } from "./active-clients";
import { ActiveClientManager } from "./active-clients";

export class ActiveClientService extends Context.Service<
  ActiveClientService,
  {
    readonly register: (clientId?: string) => string;
    readonly registerWithCwd: (
      clientId?: string,
      cwd?: string,
    ) => Effect.Effect<string>;
    readonly unregister: (clientId: string) => {
      existed: boolean;
      count: number;
    };
    readonly getCount: () => number;
    readonly getClients: () => ActiveClient[];
    readonly getCwd: (clientId: string) => Effect.Effect<string | undefined>;
  }
>()("ActiveClientService") {}

const activeClientManager = new ActiveClientManager();

export const ActiveClientServiceLive = Layer.succeed(
  ActiveClientService,
  ActiveClientService.of({
    register: (clientId) => activeClientManager.register(clientId),
    registerWithCwd: (clientId, cwd) =>
      Effect.sync(() => activeClientManager.register(clientId, cwd)),
    unregister: (clientId) => activeClientManager.unregister(clientId),
    getCount: () => activeClientManager.getCount(),
    getClients: () => activeClientManager.getClients(),
    getCwd: (clientId) =>
      Effect.sync(() => activeClientManager.getCwd(clientId)),
  }),
);

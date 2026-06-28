import { Context, Effect, Layer } from "effect";

import type { UnifiedMessage } from "../llm/types";
import type { Session } from "./manager";
import { SessionManager } from "./manager";

export class SessionService extends Context.Service<
  SessionService,
  {
    readonly create: (
      name: string,
      model: string,
      provider: string,
    ) => Effect.Effect<Session>;
    readonly get: (id: string) => Effect.Effect<Session | null>;
    readonly update: (session: Session) => Effect.Effect<void>;
    readonly delete: (id: string) => Effect.Effect<boolean>;
    readonly cleanupEmpty: Effect.Effect<number>;
    readonly list: Effect.Effect<Session[]>;
    readonly addMessage: (
      id: string,
      message: UnifiedMessage,
    ) => Effect.Effect<Session | null>;
    readonly getMessages: (id: string) => Effect.Effect<UnifiedMessage[]>;
  }
>()("SessionService") {}

const sessionManager = new SessionManager();

export const SessionServiceLive = Layer.succeed(
  SessionService,
  SessionService.of({
    create: (name, model, provider) =>
      Effect.sync(() => sessionManager.create(name, model, provider)),
    get: (id) => Effect.sync(() => sessionManager.get(id)),
    update: (session) => Effect.sync(() => sessionManager.update(session)),
    delete: (id) => Effect.sync(() => sessionManager.delete(id)),
    cleanupEmpty: Effect.sync(() => sessionManager.cleanupEmpty()),
    list: Effect.sync(() => sessionManager.list()),
    addMessage: (id, message) =>
      Effect.sync(() => sessionManager.addMessage(id, message)),
    getMessages: (id) => Effect.sync(() => sessionManager.getMessages(id)),
  }),
);

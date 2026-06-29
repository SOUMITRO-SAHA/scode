import { describe, expect, it } from "vitest";

import { Effect } from "effect";

import {
  ActiveClientService,
  ActiveClientServiceLive,
} from "../session/active-clients-service";

const runSync = Effect.runSync;

describe("ActiveClientService", () => {
  it("is defined and has expected methods", () => {
    expect(ActiveClientService.key).toBe("ActiveClientService");
    expect(ActiveClientService.of).toBeDefined();
  });

  it("provides working register and unregister via layer", () => {
    const effect = Effect.gen(function* () {
      const svc = yield* ActiveClientService;
      const id = svc.register("test-client");
      const count1 = svc.getCount();
      const { existed, count: count2 } = svc.unregister("test-client");
      const count3 = svc.getCount();
      return { id, count1, existed, count2, count3 };
    });
    const result = runSync(Effect.provide(effect, ActiveClientServiceLive));
    expect(result.id).toBe("test-client");
    expect(result.count1).toBe(1);
    expect(result.existed).toBe(true);
    expect(result.count2).toBe(0);
    expect(result.count3).toBe(0);
  });

  it("handles unknown client unregister", () => {
    const effect = Effect.gen(function* () {
      const svc = yield* ActiveClientService;
      return svc.unregister("nonexistent");
    });
    const result = runSync(Effect.provide(effect, ActiveClientServiceLive));
    expect(result.existed).toBe(false);
    expect(result.count).toBe(0);
  });

  it("lists registered clients", () => {
    const effect = Effect.gen(function* () {
      const svc = yield* ActiveClientService;
      svc.register("a");
      svc.register("b");
      return svc.getClients();
    });
    const clients = runSync(Effect.provide(effect, ActiveClientServiceLive));
    expect(clients).toHaveLength(2);
    expect(clients.map((c) => c.id).sort()).toEqual(["a", "b"]);
  });

  it("registerWithCwd stores cwd and getCwd retrieves it", () => {
    const effect = Effect.gen(function* () {
      const svc = yield* ActiveClientService;
      const id = yield* svc.registerWithCwd("my-client", "/some/workspace");
      const cwd = yield* svc.getCwd(id);
      return { id, cwd };
    });
    const result = runSync(Effect.provide(effect, ActiveClientServiceLive));
    expect(result.id).toBe("my-client");
    expect(result.cwd).toBe("/some/workspace");
  });

  it("getCwd returns undefined for unknown client", () => {
    const effect = Effect.gen(function* () {
      const svc = yield* ActiveClientService;
      return yield* svc.getCwd("nonexistent");
    });
    const result = runSync(Effect.provide(effect, ActiveClientServiceLive));
    expect(result).toBeUndefined();
  });

  it("registerWithCwd without cwd stores undefined", () => {
    const effect = Effect.gen(function* () {
      const svc = yield* ActiveClientService;
      const id = yield* svc.registerWithCwd("no-cwd");
      return yield* svc.getCwd(id);
    });
    const result = runSync(Effect.provide(effect, ActiveClientServiceLive));
    expect(result).toBeUndefined();
  });
});

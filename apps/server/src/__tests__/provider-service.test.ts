import { describe, expect, it } from "vitest";

import { Effect } from "effect";

import { ProviderService, ProviderServiceLive } from "../llm/provider-service";

const runSync = Effect.runSync;

describe("ProviderService", () => {
  it("is defined with expected methods", () => {
    expect(ProviderService.key).toBe("ProviderService");
    expect(ProviderService.of).toBeDefined();
  });

  it("lists all registered providers via layer", () => {
    const effect = Effect.gen(function* () {
      const svc = yield* ProviderService;
      return svc.listProviders();
    });
    const providers = runSync(Effect.provide(effect, ProviderServiceLive));
    expect(providers.length).toBeGreaterThanOrEqual(5);
    const ids = providers.map((p) => p.id);
    expect(ids).toContain("claude");
    expect(ids).toContain("gemini");
    expect(ids).toContain("deepseek");
  });

  it("resolves a valid model string", () => {
    const effect = Effect.gen(function* () {
      const svc = yield* ProviderService;
      return svc.resolve("claude/claude-sonnet-4");
    });
    const { provider, model } = runSync(
      Effect.provide(effect, ProviderServiceLive),
    );
    expect(provider.id).toBe("claude");
    expect(model).toBe("claude-sonnet-4");
  });

  it("throws on unknown provider", () => {
    const effect = Effect.gen(function* () {
      const svc = yield* ProviderService;
      return svc.resolve("unknown/model");
    });
    expect(() => runSync(Effect.provide(effect, ProviderServiceLive))).toThrow(
      /Unknown provider.*unknown/,
    );
  });

  it("gets a provider by id", () => {
    const effect = Effect.gen(function* () {
      const svc = yield* ProviderService;
      return svc.getProvider("gemini");
    });
    const p = runSync(Effect.provide(effect, ProviderServiceLive));
    expect(p).toBeDefined();
    expect(p!.id).toBe("gemini");
  });

  it("returns undefined for unknown provider id", () => {
    const effect = Effect.gen(function* () {
      const svc = yield* ProviderService;
      return svc.getProvider("totally-fake");
    });
    const p = runSync(Effect.provide(effect, ProviderServiceLive));
    expect(p).toBeUndefined();
  });
});

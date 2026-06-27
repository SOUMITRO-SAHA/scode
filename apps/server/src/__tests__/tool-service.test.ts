import { describe, expect, it } from "vitest";

import { Effect, Layer } from "effect";

import { ToolService, ToolServiceLive } from "../tool/service";

const runPromise = Effect.runPromise;
const runSync = Effect.runSync;

describe("ToolService", () => {
  it("is defined with expected methods", () => {
    expect(ToolService.key).toBe("ToolService");
    expect(ToolService.of).toBeDefined();
  });

  it("provides definitions for all registered tools via layer", () => {
    const effect = Effect.gen(function* () {
      const svc = yield* ToolService;
      return svc.definitions();
    });
    const defs = runSync(Effect.provide(effect, ToolServiceLive));
    expect(defs.length).toBeGreaterThanOrEqual(6);
    const names = defs.map((d) => d.name).sort();
    expect(names).toEqual(["bash", "edit", "glob", "grep", "read", "write"]);
  });

  it("settles a known tool call", async () => {
    const result = await runPromise(
      Effect.provide(
        Effect.gen(function* () {
          const svc = yield* ToolService;
          return yield* svc.settle({
            id: "1",
            name: "glob",
            input: {
              pattern: "apps/server/src/__tests__/tool-service.test.ts",
            },
          });
        }),
        ToolServiceLive,
      ),
    );
    expect(result).toBeTruthy();
    expect(
      Array.isArray(result) ||
        typeof result === "string" ||
        typeof result === "object",
    ).toBe(true);
  });

  it("fails on unknown tool call", async () => {
    await expect(
      runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const svc = yield* ToolService;
            return yield* svc.settle({
              id: "99",
              name: "nonexistent",
              input: {},
            });
          }),
          ToolServiceLive,
        ),
      ),
    ).rejects.toThrow("Unknown tool: nonexistent");
  });
});

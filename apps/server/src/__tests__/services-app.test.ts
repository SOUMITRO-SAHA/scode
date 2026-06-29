import { describe, expect, it } from "vitest";

import { Effect } from "effect";

import {
  ActiveClientService,
  ConfigService,
  ProviderService,
  SessionService,
  SkillService,
  ToolService,
} from "../services/index";

const runSync = Effect.runSync;

describe("AppLayer composition", () => {
  it("exports all service tags", () => {
    expect(ConfigService.key).toBe("ConfigService");
    expect(SessionService.key).toBe("SessionService");
    expect(ProviderService.key).toBe("ProviderService");
    expect(ToolService.key).toBe("ToolService");
    expect(ActiveClientService.key).toBe("ActiveClientService");
    expect(SkillService.key).toBe("SkillService");
  });

  it("all services can be resolved from the exported runtime", async () => {
    const { runtime } = await import("../services/app");

    const result = await runtime.runPromise(
      Effect.gen(function* () {
        const cfg = yield* ConfigService;
        const sess = yield* SessionService;
        const prov = yield* ProviderService;
        const tool = yield* ToolService;
        const ac = yield* ActiveClientService;
        const sk = yield* SkillService;
        return {
          hasConfig: typeof cfg.get === "object",
          hasSession: typeof sess.create === "function",
          hasProvider: typeof prov.listProviders === "function",
          hasTool: typeof tool.definitions === "function",
          hasAc: typeof ac.register === "function",
          hasSkill: typeof sk.loadAllSkills === "function",
          hasSkillMatch: typeof sk.matchSkills === "function",
        };
      }),
    );

    expect(result.hasConfig).toBe(true);
    expect(result.hasSession).toBe(true);
    expect(result.hasProvider).toBe(true);
    expect(result.hasTool).toBe(true);
    expect(result.hasAc).toBe(true);
    expect(result.hasSkill).toBe(true);
    expect(result.hasSkillMatch).toBe(true);
  });

  it("runtime resolves services with correct capabilities", async () => {
    const { runtime } = await import("../services/app");

    const result = await runtime.runPromise(
      Effect.gen(function* () {
        const tool = yield* ToolService;
        const defs = tool.definitions();
        const providers = (yield* ProviderService).listProviders();
        return {
          toolCount: defs.length,
          providerCount: providers.length,
          toolNames: defs.map((d) => d.name).sort(),
          providerIds: providers.map((p) => p.id).sort(),
        };
      }),
    );

    expect(result.toolCount).toBe(7);
    expect(result.providerCount).toBeGreaterThanOrEqual(5);
    expect(result.toolNames).toEqual([
      "bash",
      "edit",
      "glob",
      "grep",
      "read",
      "skill",
      "write",
    ]);
    expect(result.providerIds).toContain("claude");
    expect(result.providerIds).toContain("gemini");
    expect(result.providerIds).toContain("deepseek");
  });
});

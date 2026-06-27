import { describe, expect, it, vi } from "vitest";

import { Effect } from "effect";

import type { SkillDir } from "../skill/discover";
import { SkillService, SkillServiceLive } from "../skill/service";
import type { Skill } from "../types";

const mockSkills: Skill[] = [
  { name: "greeting", description: "Greet users", body: "Greet warmly." },
  { name: "weather", description: "Check weather", body: "Use weather API." },
];

const mockDirs: SkillDir[] = [
  { name: "greeting", path: "/fake/greeting" },
  { name: "weather", path: "/fake/weather" },
];

vi.mock("../skill/discover", () => ({
  discover: vi.fn(() => mockDirs),
}));

vi.mock("../skill/loader", () => ({
  loadSkill: vi.fn((dir: SkillDir) => {
    const found = mockSkills.find((s) => s.name === dir.name);
    return found ?? null;
  }),
}));

vi.mock("../skill/matcher", () => ({
  matchSkills: vi.fn((prompt: string, skills: Skill[]) => {
    const matched = skills.filter((s) => prompt.toLowerCase().includes(s.name));
    return matched.length > 0
      ? [...matched, { name: "main", description: "", body: "" } as Skill]
      : [{ name: "main", description: "", body: "" } as Skill];
  }),
}));

const runSync = Effect.runSync;

describe("SkillService", () => {
  it("is defined with expected methods", () => {
    expect(SkillService.key).toBe("SkillService");
    expect(SkillService.of).toBeDefined();
  });

  it("loads all skills via layer", () => {
    const effect = Effect.gen(function* () {
      const svc = yield* SkillService;
      return svc.loadAllSkills();
    });
    const skills = runSync(Effect.provide(effect, SkillServiceLive));
    expect(skills).toHaveLength(2);
    expect(skills.map((s) => s.name).sort()).toEqual(["greeting", "weather"]);
  });

  it("discovers skill directories", () => {
    const effect = Effect.gen(function* () {
      const svc = yield* SkillService;
      return svc.discover();
    });
    const dirs = runSync(Effect.provide(effect, SkillServiceLive));
    expect(dirs).toHaveLength(2);
  });

  it("matches skills against a prompt", () => {
    const effect = Effect.gen(function* () {
      const svc = yield* SkillService;
      return svc.matchSkills("weather today", mockSkills);
    });
    const matched = runSync(Effect.provide(effect, SkillServiceLive));
    expect(matched.length).toBeGreaterThanOrEqual(1);
    const names = matched.map((s) => s.name);
    expect(names).toContain("weather");
  });
});

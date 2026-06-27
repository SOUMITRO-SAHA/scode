import { Context, Effect, Layer } from "effect";

import type { Skill } from "../types";
import type { SkillDir } from "./discover";
import { discover } from "./discover";
import { loadSkill } from "./loader";
import { matchSkills } from "./matcher";

export class SkillService extends Context.Service<
  SkillService,
  {
    readonly discover: () => SkillDir[];
    readonly loadSkill: (dir: SkillDir) => Skill | null;
    readonly loadAllSkills: () => Skill[];
    readonly matchSkills: (prompt: string, skills: Skill[]) => Skill[];
  }
>()("SkillService") {}

export const SkillServiceLive = Layer.succeed(
  SkillService,
  SkillService.of({
    discover: () => discover(),
    loadSkill: (dir) => loadSkill(dir),
    loadAllSkills: () =>
      discover()
        .map(loadSkill)
        .filter((s): s is Skill => s !== null),
    matchSkills: (prompt, skills) => matchSkills(prompt, skills),
  }),
);

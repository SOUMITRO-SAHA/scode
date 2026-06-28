import { Context, Effect, Layer } from "effect";

import type { Skill } from "../types";
import type { SkillDir } from "./discover";
import { discover } from "./discover";
import { SkillDiscoverError, SkillLoadError } from "./error";
import { loadSkill, loadSkillMeta } from "./loader";
import { matchSkills } from "./matcher";

export class SkillService extends Context.Service<
  SkillService,
  {
    readonly discover: Effect.Effect<SkillDir[], SkillDiscoverError>;
    readonly loadSkill: (
      dir: SkillDir,
    ) => Effect.Effect<Skill | null, SkillLoadError>;
    readonly loadSkillMeta: (
      dir: SkillDir,
    ) => Effect.Effect<
      { name: string; description: string } | null,
      SkillLoadError
    >;
    readonly loadAllSkills: Effect.Effect<
      Skill[],
      SkillDiscoverError | SkillLoadError
    >;
    readonly matchSkills: (prompt: string, skills: Skill[]) => Skill[];
  }
>()("SkillService") {}

export const SkillServiceLive = Layer.succeed(
  SkillService,
  SkillService.of({
    discover: discover(),
    loadSkill: (dir) => loadSkill(dir),
    loadSkillMeta: (dir) => loadSkillMeta(dir),
    loadAllSkills: Effect.gen(function* () {
      const dirs = yield* discover();
      const metas = yield* Effect.all(
        dirs.map((d) => loadSkillMeta(d)),
        { concurrency: 1 },
      );
      return metas
        .filter((m): m is { name: string; description: string } => m !== null)
        .map((m) => ({ ...m, body: "" }));
    }),
    matchSkills: (prompt, skills) => matchSkills(prompt, skills),
  }),
);

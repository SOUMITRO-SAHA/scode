import { Context, Effect, Layer } from "effect";

import type { Skill } from "../types";
import type { SkillDir } from "./discover";
import { discover } from "./discover";
import { SkillDiscoverError, SkillLoadError } from "./error";
import { loadSkill } from "./loader";
import { matchSkills } from "./matcher";

export class SkillService extends Context.Service<
  SkillService,
  {
    readonly discover: Effect.Effect<SkillDir[], SkillDiscoverError>;
    readonly loadSkill: (
      dir: SkillDir,
    ) => Effect.Effect<Skill | null, SkillLoadError>;
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
    discover: Effect.try({
      try: () => discover(),
      catch: (err) =>
        new SkillDiscoverError({ dir: ".agents/skills", message: String(err) }),
    }),
    loadSkill: (dir) =>
      Effect.try({
        try: () => loadSkill(dir),
        catch: (err) =>
          new SkillLoadError({
            dir: dir.name,
            reason: "parse-error",
            detail: String(err),
          }),
      }),
    loadAllSkills: Effect.flatMap(
      Effect.try({
        try: () => discover(),
        catch: (err) =>
          new SkillDiscoverError({
            dir: ".agents/skills",
            message: String(err),
          }),
      }),
      (dirs) =>
        Effect.all(
          dirs.map((dir) =>
            Effect.try({
              try: () => loadSkill(dir),
              catch: (err) =>
                new SkillLoadError({
                  dir: dir.name,
                  reason: "parse-error",
                  detail: String(err),
                }),
            }),
          ),
          { concurrency: 1 },
        ).pipe(
          Effect.map((skills) => skills.filter((s): s is Skill => s !== null)),
        ),
    ),
    matchSkills: (prompt, skills) => matchSkills(prompt, skills),
  }),
);

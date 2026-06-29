import { Effect, Schema } from "effect";
import { readFileSync, writeFileSync } from "node:fs";

import { Tool } from "./core";
import { safeResolve } from "./workspace";

import { ToolFailure } from "@scode/shared/effect";

const InputStruct = Schema.Struct({
  path: Schema.String,
  oldString: Schema.String,
  newString: Schema.String,
  replaceAll: Schema.optional(Schema.Boolean),
});

function isToolError(err: unknown): err is { _tag: string } {
  return typeof err === "object" && err !== null && "_tag" in err;
}

export const tool = Tool.make({
  name: "edit",
  description: "Exact string replacement in an existing file",
  input: InputStruct,
  output: Schema.Struct({ ok: Schema.Boolean }),
  execute: ({ path, oldString, newString, replaceAll }) => {
    return Effect.try({
      try: () => {
        const resolved = safeResolve(path);
        const content = readFileSync(resolved, "utf-8");

        if (!content.includes(oldString)) {
          throw { _tag: "NotFound", message: "oldString not found in file" };
        }

        const occurrences = content.split(oldString).length - 1;
        if (occurrences > 1 && !replaceAll) {
          throw {
            _tag: "MultipleMatches",
            message:
              "Multiple matches for oldString; set replaceAll=true or refine oldString",
          };
        }

        const updated = replaceAll
          ? content.split(oldString).join(newString)
          : content.replace(oldString, newString);

        writeFileSync(resolved, updated, "utf-8");
        return { ok: true };
      },
      catch: (err) => {
        if (isToolError(err)) {
          if (err._tag === "NotFound") {
            return new ToolFailure({ error: "oldString not found in file" });
          }
          if (err._tag === "MultipleMatches") {
            return new ToolFailure({
              error:
                "Multiple matches for oldString; set replaceAll=true or refine oldString",
            });
          }
        }
        if (err instanceof ToolFailure) return err;
        return new ToolFailure({ error: `Edit error: ${String(err)}` });
      },
    });
  },
});

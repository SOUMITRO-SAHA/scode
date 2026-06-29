import { Effect, Schema } from "effect";
import { readFileSync, readdirSync, statSync } from "node:fs";

import { Tool } from "./core";
import { safeResolve } from "./workspace";

import { ToolFailure } from "@scode/shared/effect";

const InputStruct = Schema.Struct({
  path: Schema.String,
  offset: Schema.optional(Schema.Number),
  limit: Schema.optional(Schema.Number),
});

export const tool = Tool.make({
  name: "read",
  description: "Read file contents or list directory entries",
  input: InputStruct,
  output: Schema.Struct({
    content: Schema.optional(Schema.String),
    totalLines: Schema.optional(Schema.Number),
    entries: Schema.optional(Schema.Array(Schema.String)),
  }),
  execute: ({ path, offset, limit }) => {
    return Effect.try({
      try: () => {
        const resolved = safeResolve(path);
        const stat = statSync(resolved);

        if (stat.isDirectory()) {
          const entries = readdirSync(resolved);
          return { entries };
        }

        const content = readFileSync(resolved, "utf-8");
        const lines = content.split("\n");
        const off = offset ?? 1;
        const lim = limit ?? lines.length;

        return {
          content: lines.slice(off - 1, off - 1 + lim).join("\n"),
          totalLines: lines.length,
        };
      },
      catch: (err) => new ToolFailure({ error: `Read error: ${String(err)}` }),
    });
  },
});

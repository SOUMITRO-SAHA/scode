import { Effect, Schema } from "effect";
import { relative, resolve } from "node:path";

import { Tool } from "./core";
import { isIgnoredPath, searchText } from "./ripgrep";
import { getWorkspace } from "./workspace";

import { ToolFailure } from "@scode/shared/effect";

const InputStruct = Schema.Struct({
  pattern: Schema.String,
  include: Schema.optional(Schema.String),
  path: Schema.optional(Schema.String),
});

export const tool = Tool.make({
  name: "grep",
  description: "Search file contents by regex pattern",
  input: InputStruct,
  output: Schema.Struct({
    results: Schema.Array(
      Schema.Struct({
        file: Schema.String,
        line: Schema.Number,
        content: Schema.String,
      }),
    ),
  }),
  execute: ({ pattern, include, path }) => {
    return Effect.tryPromise({
      try: async () => {
        const workspace = getWorkspace();
        const searchPath = path ? resolve(workspace, path) : workspace;

        let results;
        try {
          results = await searchText(searchPath, pattern, {
            include: include ?? undefined,
          });
        } catch (err) {
          const msg = String(err);
          if (msg.includes("ripgrep (rg) is not installed")) {
            return { results: [] };
          }
          throw err;
        }

        return {
          results: results
            .map((r) => ({
              file: relative(searchPath, r.file),
              line: r.line,
              content: r.content,
            }))
            .filter((r) => !isIgnoredPath(r.file)),
        };
      },
      catch: (err) => new ToolFailure({ error: `Grep error: ${String(err)}` }),
    });
  },
});

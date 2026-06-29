import { Effect, Schema } from "effect";
import { relative, resolve } from "node:path";

import { Tool } from "./core";
import { isIgnoredPath, listFiles } from "./ripgrep";
import { getWorkspace } from "./workspace";

import { ToolFailure } from "@scode/shared/effect";

const InputStruct = Schema.Struct({
  pattern: Schema.String,
  path: Schema.optional(Schema.String),
});

export const tool = Tool.make({
  name: "glob",
  description: "Find files by glob pattern",
  input: InputStruct,
  output: Schema.Struct({
    files: Schema.Array(Schema.String),
  }),
  execute: ({ pattern, path }) => {
    return Effect.tryPromise({
      try: async () => {
        const workspace = getWorkspace();
        const searchPath = path ? resolve(workspace, path) : workspace;

        let files;
        try {
          files = await listFiles(searchPath, pattern);
        } catch (err) {
          const msg = String(err);
          if (msg.includes("ripgrep (rg) is not installed")) {
            return { files: [] };
          }
          throw err;
        }

        return {
          files: files
            .map((f) => relative(workspace, resolve(searchPath, f)))
            .filter((f) => !f.startsWith("..") && !isIgnoredPath(f)),
        };
      },
      catch: (err) => new ToolFailure({ error: `Glob error: ${String(err)}` }),
    });
  },
});

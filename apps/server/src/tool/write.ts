import { Effect, Schema } from "effect";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { Tool } from "./core";
import { safeResolve } from "./workspace";

import { ToolFailure } from "@scode/shared/effect";

const InputStruct = Schema.Struct({
  path: Schema.String,
  content: Schema.String,
});

export const tool = Tool.make({
  name: "write",
  description:
    "Create or overwrite a file. Creates parent directories if needed.",
  input: InputStruct,
  output: Schema.Struct({ ok: Schema.Boolean }),
  execute: ({ path, content }) => {
    return Effect.try({
      try: () => {
        const resolved = safeResolve(path);
        mkdirSync(dirname(resolved), { recursive: true });
        writeFileSync(resolved, content, "utf-8");
        return { ok: true };
      },
      catch: (err) => new ToolFailure({ error: `Write error: ${String(err)}` }),
    });
  },
});

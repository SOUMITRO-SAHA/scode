import { Effect } from "effect";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

import type { ToolDefinition, ToolHandler } from "../types";
import { getWorkspace } from "./workspace";

import { MAX_BUFFER } from "@scode/shared/constants";
import { splitLines } from "@scode/shared/utils";

export const definition: ToolDefinition = {
  name: "glob",
  description: "Find files by glob pattern",
  inputSchema: {
    type: "object",
    properties: {
      pattern: {
        type: "string",
        description: "Glob pattern to match (e.g. '**/*.ts')",
      },
      path: {
        type: "string",
        description: "Directory to search in (default: workspace root)",
      },
    },
    required: ["pattern"],
  },
};

export const handler: ToolHandler = async (input: Record<string, unknown>) => {
  const pattern = input.pattern as string;
  const workspace = getWorkspace();
  const searchPath = input.path
    ? resolve(workspace, input.path as string)
    : workspace;

  try {
    const stdout = execFileSync(
      "find",
      [
        searchPath,
        "-path",
        "*/node_modules",
        "-prune",
        "-o",
        "-path",
        pattern,
        "-print",
      ],
      { encoding: "utf-8", maxBuffer: MAX_BUFFER },
    );
    const files = Effect.runSync(splitLines(stdout.trim()));
    return { files };
  } catch {
    return { files: [] };
  }
};

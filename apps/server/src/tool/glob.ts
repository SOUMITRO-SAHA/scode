import { execSync } from "node:child_process";
import { resolve } from "node:path";

import type { ToolDefinition, ToolHandler } from "../types";

import { MAX_BUFFER } from "@scode/shared/constants";

const WORKSPACE = process.cwd();

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
  const searchPath = input.path
    ? resolve(WORKSPACE, input.path as string)
    : WORKSPACE;

  try {
    const stdout = execSync(
      `find "${searchPath}" -path '*/node_modules' -prune -o -path "${pattern}" -print`,
      { encoding: "utf-8", maxBuffer: MAX_BUFFER },
    );
    const files = stdout.trim().split("\n").filter(Boolean);
    return { files };
  } catch {
    return { files: [] };
  }
};

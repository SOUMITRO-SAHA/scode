import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

import type { ToolDefinition, ToolHandler } from "../types";
import { getWorkspace } from "./workspace";

import { MAX_BUFFER } from "@scode/shared/constants";

export const definition: ToolDefinition = {
  name: "grep",
  description: "Search file contents by regex pattern",
  inputSchema: {
    type: "object",
    properties: {
      pattern: { type: "string", description: "Regex pattern to search for" },
      include: {
        type: "string",
        description: "File glob pattern to filter (e.g. '*.ts')",
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

  const args = ["-rn", "--binary-files=without-match", pattern, searchPath];
  if (input.include) {
    args.splice(2, 0, "--include", input.include as string);
  }

  try {
    const stdout = execFileSync("grep", args, {
      encoding: "utf-8",
      maxBuffer: MAX_BUFFER,
    });
    const results = stdout
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(":");
        return {
          file: parts[0],
          line: Number(parts[1]),
          content: parts.slice(2).join(":"),
        };
      });
    return { results };
  } catch {
    return { results: [] };
  }
};

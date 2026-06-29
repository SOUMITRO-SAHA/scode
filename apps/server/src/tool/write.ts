import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import type { ToolDefinition, ToolHandler } from "../types";
import { safeResolve } from "./workspace";

export const definition: ToolDefinition = {
  name: "write",
  description:
    "Create or overwrite a file. Creates parent directories if needed.",
  inputSchema: {
    type: "object",
    properties: {
      path: { type: "string", description: "Path to the file" },
      content: { type: "string", description: "File content" },
    },
    required: ["path", "content"],
  },
};

export const handler: ToolHandler = async (input: Record<string, unknown>) => {
  const inputPath = input.path as string;
  const content = input.content as string;
  const resolved = safeResolve(inputPath);
  mkdirSync(dirname(resolved), { recursive: true });
  writeFileSync(resolved, content, "utf-8");
  return { ok: true };
};

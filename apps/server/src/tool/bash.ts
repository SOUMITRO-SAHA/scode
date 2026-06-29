import { execSync } from "node:child_process";
import { resolve } from "node:path";

import type { ToolDefinition, ToolHandler } from "../types";
import { getWorkspace } from "./workspace";

import { MAX_BUFFER } from "@scode/shared/constants";

export const definition: ToolDefinition = {
  name: "bash",
  description:
    "Execute a shell command. Returns stdout, stderr, and exit code.",
  inputSchema: {
    type: "object",
    properties: {
      command: { type: "string", description: "Shell command to execute" },
      workdir: {
        type: "string",
        description: "Working directory (default: workspace root)",
      },
      timeout: {
        type: "number",
        description: "Timeout in milliseconds (default: 120000)",
      },
    },
    required: ["command"],
  },
};

export const handler: ToolHandler = async (input: Record<string, unknown>) => {
  const command = input.command as string;
  const workspace = getWorkspace();
  const workdir = input.workdir
    ? resolve(workspace, input.workdir as string)
    : workspace;
  const timeout = (input.timeout as number) ?? 120_000;

  try {
    const stdout = execSync(command, {
      cwd: workdir,
      timeout,
      encoding: "utf-8",
      maxBuffer: MAX_BUFFER,
    });
    return { stdout, stderr: "", exitCode: 0 };
  } catch (err: unknown) {
    const error = err as { stdout?: string; stderr?: string; status?: number };
    return {
      stdout: error.stdout ?? "",
      stderr: error.stderr ?? "",
      exitCode: error.status ?? 1,
    };
  }
};

import { execSync } from "node:child_process"
import { resolve } from "node:path"
import type { ToolDefinition, ToolHandler } from "../types"

const WORKSPACE = process.cwd()

export const definition: ToolDefinition = {
  name: "bash",
  description: "Execute a shell command. Returns stdout, stderr, and exit code.",
  inputSchema: {
    type: "object",
    properties: {
      command: { type: "string", description: "Shell command to execute" },
      workdir: { type: "string", description: "Working directory (default: workspace root)" },
      timeout: { type: "number", description: "Timeout in milliseconds (default: 120000)" },
    },
    required: ["command"],
  },
}

export const handler: ToolHandler = async (input: Record<string, unknown>) => {
  const command = input.command as string
  const workdir = input.workdir
    ? resolve(WORKSPACE, input.workdir as string)
    : WORKSPACE
  const timeout = (input.timeout as number) ?? 120_000

  try {
    const stdout = execSync(command, {
      cwd: workdir,
      timeout,
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024,
    })
    return { stdout, stderr: "", exitCode: 0 }
  } catch (err: unknown) {
    const error = err as { stdout?: string; stderr?: string; status?: number }
    return {
      stdout: error.stdout ?? "",
      stderr: error.stderr ?? "",
      exitCode: error.status ?? 1,
    }
  }
}

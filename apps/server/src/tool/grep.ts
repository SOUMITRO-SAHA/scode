import { execSync } from "node:child_process"
import { resolve } from "node:path"
import type { ToolDefinition, ToolHandler } from "../types.js"

const WORKSPACE = process.cwd()

export const definition: ToolDefinition = {
  name: "grep",
  description: "Search file contents by regex pattern",
  inputSchema: {
    type: "object",
    properties: {
      pattern: { type: "string", description: "Regex pattern to search for" },
      include: { type: "string", description: "File glob pattern to filter (e.g. '*.ts')" },
      path: { type: "string", description: "Directory to search in (default: workspace root)" },
    },
    required: ["pattern"],
  },
}

export const handler: ToolHandler = async (input: Record<string, unknown>) => {
  const pattern = input.pattern as string
  const searchPath = input.path
    ? resolve(WORKSPACE, input.path as string)
    : WORKSPACE

  let cmd = `grep -rn --binary-files=without-match "${pattern}" "${searchPath}"`
  if (input.include) {
    cmd = `grep -rn --binary-files=without-match --include="${input.include}" "${pattern}" "${searchPath}"`
  }

  try {
    const stdout = execSync(cmd, { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 })
    const results = stdout
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(":")
        return {
          file: parts[0],
          line: Number(parts[1]),
          content: parts.slice(2).join(":"),
        }
      })
    return { results }
  } catch {
    return { results: [] }
  }
}

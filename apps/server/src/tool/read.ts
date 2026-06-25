import { readFileSync, readdirSync, statSync } from "node:fs"
import { resolve } from "node:path"
import type { ToolDefinition, ToolHandler } from "../types"

const WORKSPACE = process.cwd()

function safeResolve(inputPath: string): string {
  const resolved = resolve(WORKSPACE, inputPath)
  if (!resolved.startsWith(WORKSPACE)) {
    throw new Error("Path escapes workspace")
  }
  return resolved
}

export const definition: ToolDefinition = {
  name: "read",
  description: "Read file contents or list directory entries",
  inputSchema: {
    type: "object",
    properties: {
      path: { type: "string", description: "Path to file or directory" },
      offset: { type: "number", description: "Line offset (1-indexed, file only)" },
      limit: { type: "number", description: "Max lines to read (file only)" },
    },
    required: ["path"],
  },
}

export const handler: ToolHandler = async (input: Record<string, unknown>) => {
  const inputPath = input.path as string
  const resolved = safeResolve(inputPath)
  const stat = statSync(resolved)

  if (stat.isDirectory()) {
    const entries = readdirSync(resolved)
    return { entries }
  }

  const content = readFileSync(resolved, "utf-8")
  const lines = content.split("\n")
  const offset = (input.offset as number) ?? 1
  const limit = (input.limit as number) ?? lines.length

  return {
    content: lines.slice(offset - 1, offset - 1 + limit).join("\n"),
    totalLines: lines.length,
  }
}

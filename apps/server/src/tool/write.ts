import { writeFileSync, mkdirSync } from "node:fs"
import { resolve, dirname } from "node:path"
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
  name: "write",
  description: "Create or overwrite a file. Creates parent directories if needed.",
  inputSchema: {
    type: "object",
    properties: {
      path: { type: "string", description: "Path to the file" },
      content: { type: "string", description: "File content" },
    },
    required: ["path", "content"],
  },
}

export const handler: ToolHandler = async (input: Record<string, unknown>) => {
  const inputPath = input.path as string
  const content = input.content as string
  const resolved = safeResolve(inputPath)
  mkdirSync(dirname(resolved), { recursive: true })
  writeFileSync(resolved, content, "utf-8")
  return { ok: true }
}

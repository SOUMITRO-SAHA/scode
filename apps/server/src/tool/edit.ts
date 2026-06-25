import { readFileSync, writeFileSync } from "node:fs"
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
  name: "edit",
  description: "Exact string replacement in an existing file",
  inputSchema: {
    type: "object",
    properties: {
      path: { type: "string", description: "Path to the file" },
      oldString: { type: "string", description: "Text to replace" },
      newString: { type: "string", description: "Replacement text" },
    },
    required: ["path", "oldString", "newString"],
  },
}

export const handler: ToolHandler = async (input: Record<string, unknown>) => {
  const inputPath = input.path as string
  const oldString = input.oldString as string
  const newString = input.newString as string
  const resolved = safeResolve(inputPath)
  const content = readFileSync(resolved, "utf-8")

  if (!content.includes(oldString)) {
    throw new Error("oldString not found in file")
  }

  if (content.split(oldString).length - 1 > 1 && !input.replaceAll) {
    throw new Error("Multiple matches for oldString; set replaceAll=true or refine oldString")
  }

  const updated = input.replaceAll
    ? content.split(oldString).join(newString)
    : content.replace(oldString, newString)

  writeFileSync(resolved, updated, "utf-8")
  return { ok: true }
}

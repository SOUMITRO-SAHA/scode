import { serve } from "@hono/node-server"
import { Hono } from "hono"
import { stream } from "hono/streaming"
import { Logger } from "@scode/shared/logger"
import { DEFAULT_PORT, healthUrl } from "@scode/shared/constants"
import { discover } from "./skill/discover.js"
import { loadSkill } from "./skill/loader.js"
import { matchSkills } from "./skill/matcher.js"
import { buildPrompt } from "./prompt/builder.js"
import { streamResponse } from "./claude/client.js"
import { Registry } from "./tool/registry.js"
import * as readTool from "./tool/read.js"
import * as writeTool from "./tool/write.js"
import * as editTool from "./tool/edit.js"
import * as bashTool from "./tool/bash.js"
import * as grepTool from "./tool/grep.js"
import * as globTool from "./tool/glob.js"

function buildRegistry(): Registry {
  const reg = new Registry()
  reg.register("read", readTool.definition, readTool.handler)
  reg.register("write", writeTool.definition, writeTool.handler)
  reg.register("edit", editTool.definition, editTool.handler)
  reg.register("bash", bashTool.definition, bashTool.handler)
  reg.register("grep", grepTool.definition, grepTool.handler)
  reg.register("glob", globTool.definition, globTool.handler)
  return reg
}

const logger = new Logger()
const registry = buildRegistry()
const app = new Hono()

logger.info("Server starting up")

app.get("/health", (c) => c.json({ healthy: true }))

app.post("/process", (c) =>
  stream(c, async (s) => {
    const { prompt } = await c.req.json<{ prompt: string }>()
    logger.info(`Processing prompt: "${prompt.slice(0, 80)}"`)

    const skillDirs = discover()
    logger.debug(`Discovered ${skillDirs.length} skill directories`)

    const loaded: ReturnType<typeof loadSkill>[] = skillDirs.map(loadSkill)
    const skills = loaded.filter((s): s is NonNullable<typeof s> => s !== null)
    logger.debug(`Loaded ${skills.length} skills`)

    const matched = matchSkills(prompt, skills)
    logger.debug(`Matched ${matched.length} skills: ${matched.map((s) => s.name).join(", ")}`)

    const toolDefs = registry.definitions()
    const { system, messages } = buildPrompt(matched, prompt, toolDefs)

    const conversation = [...messages]

    for (let i = 0; i < 10; i++) {
      const generator = streamResponse({ system, messages: conversation, tools: toolDefs })

      for await (const event of generator) {
        if (event.type === "text") {
          await s.write(event.delta)
        } else if (event.type === "tool_use") {
          logger.info(`Tool call: ${event.toolCall.name} (id=${event.toolCall.id.slice(0, 8)}...)`)
          let result: unknown
          try {
            result = await registry.settle(event.toolCall)
            logger.debug(`Tool ${event.toolCall.name} succeeded`)
          } catch (err: unknown) {
            result = { error: err instanceof Error ? err.message : String(err) }
            logger.warn(`Tool ${event.toolCall.name} failed: ${result}`)
          }

          conversation.push({
            role: "assistant",
            content: [
              {
                type: "tool_use" as const,
                id: event.toolCall.id,
                name: event.toolCall.name,
                input: event.toolCall.input,
              },
            ],
          })
          conversation.push({
            role: "user" as const,
            content: [
              {
                type: "tool_result" as const,
                tool_use_id: event.toolCall.id,
                content: JSON.stringify(result),
              },
            ],
          })
        } else if (event.type === "done") {
          break
        }
      }
    }
  }),
)

const port = Number(process.argv.find((a) => a.startsWith("--port="))?.split("=")[1] ?? DEFAULT_PORT)

serve({ fetch: app.fetch, port }, (info) => {
  logger.info(`Server ready on ${healthUrl()}`)
})

process.on("SIGINT", () => {
  logger.info("Server shutting down")
  logger.close()
  process.exit(0)
})

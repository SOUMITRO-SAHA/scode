import { serve } from "@hono/node-server"
import { Hono } from "hono"
import { stream } from "hono/streaming"

const app = new Hono()

app.get("/health", (c) => {
  return c.json({ healthy: true })
})

app.post("/process", (c) => {
  return stream(c, async (stream) => {
    const { prompt } = await c.req.json<{ prompt: string }>()

    // TODO: skill discovery, matching, loading, prompt building, Claude call
    // For now, echo back a placeholder response
    const words = [
      `You asked: "${prompt}"`,
      "",
      "This is a placeholder — the skill system, prompt builder, and Claude integration",
      "are coming next. Here's what will happen:",
      "",
      "1. discover skills from .skills/ directory",
      "2. match prompt to relevant skills (keyword matching)",
      "3. load matched SKILL.md files",
      "4. build system prompt with skill context",
      "5. call Claude Sonnet with tools (read, write, edit, bash, grep, glob)",
      "6. execute tool calls and continue the loop until Claude is done",
      "7. stream the final response here",
    ]

    for (const line of words) {
      await stream.write(line + "\n")
      await stream.sleep(50)
    }
  })
})

const port = Number(process.argv.find((a) => a.startsWith("--port="))?.split("=")[1] ?? 3000)

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Server ready on http://127.0.0.1:${info.port}`)
})

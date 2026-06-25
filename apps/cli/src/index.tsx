import { createCliRenderer } from "@opentui/core"
import { createRoot } from "@opentui/react"
import { ensureServer, stopServer } from "./daemon.js"
import { sendPrompt } from "./client.js"
import { App } from "./app.js"
import { stdout } from "node:process"

async function main() {
  const args = process.argv.slice(2)
  const promptIndex = args.indexOf("--prompt")
  const directPrompt = promptIndex !== -1 ? args[promptIndex + 1] : null

  let serverUrl: string
  try {
    serverUrl = await ensureServer()
  } catch (err) {
    console.error("Failed to connect to server:", (err as Error).message)
    process.exit(1)
  }

  if (directPrompt) {
    await sendPrompt(directPrompt, serverUrl, (token) => {
      stdout.write(token)
    })
    stdout.write("\n")
    stopServer()
    process.exit(0)
  }

  const renderer = await createCliRenderer({
    exitOnCtrlC: false,
    targetFps: 30,
  })

  process.on("SIGINT", () => {
    renderer.destroy()
    stopServer()
    process.exit(0)
  })

  createRoot(renderer).render(<App serverUrl={serverUrl} />)
}

main().catch((err) => {
  console.error("Fatal:", err)
  stopServer()
  process.exit(1)
})

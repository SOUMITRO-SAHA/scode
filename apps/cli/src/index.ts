import { createInterface } from "node:readline/promises"
import { stdin, stdout } from "node:process"
import { ensureServer, stopServer } from "./daemon.js"
import { sendPrompt } from "./client.js"

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

  process.on("SIGINT", () => {
    stopServer()
    process.exit(0)
  })

  if (directPrompt) {
    await sendPrompt(directPrompt, serverUrl, (token) => {
      stdout.write(token)
    })
    stdout.write("\n")
    process.exit(0)
  }

  console.log("scode — AI coding agent. Type your prompt (Ctrl+C to quit)\n")

  const rl = createInterface({ input: stdin, output: stdout })

  while (true) {
    const prompt = await rl.question("> ")
    if (!prompt.trim()) continue

    await sendPrompt(prompt, serverUrl, (token) => {
      stdout.write(token)
    })

    stdout.write("\n\n")
  }
}

main().catch((err) => {
  console.error("Fatal:", err)
  stopServer()
  process.exit(1)
})

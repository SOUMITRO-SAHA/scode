import { createCliRenderer } from "@opentui/core"
import { createRoot } from "@opentui/react"
import { ensureServer, stopServer } from "./services/daemon.js"
import { sendPrompt } from "./services/client.js"
import { App } from "./app.js"
import { stdin, stdout } from "node:process"
import { createInterface } from "node:readline"
import { Logger } from "@scode/shared/logger"

const logger = new Logger({ stderr: true })

async function main() {
  const args = process.argv.slice(2)
  const promptIndex = args.indexOf("--prompt")
  const directPrompt = promptIndex !== -1 ? args[promptIndex + 1] : null

  let serverUrl: string
  try {
    serverUrl = await ensureServer()
  } catch (err) {
    logger.error(`Failed to connect to server: ${(err as Error).message}`)
    process.exit(1)
  }

  if (directPrompt) {
    logger.info(`Single-shot mode: "${directPrompt.slice(0, 60)}..."`)
    await sendPrompt(directPrompt, serverUrl, (token) => {
      stdout.write(token)
    })
    stdout.write("\n")
    stopServer()
    logger.close()
    process.exit(0)
  }

  const tuiOk = await tryTui(serverUrl)
  if (tuiOk) return

  logger.info("TUI unavailable — falling back to REPL mode")
  await repl(serverUrl)
}

async function tryTui(serverUrl: string): Promise<boolean> {
  try {
    const renderer = await createCliRenderer({
      exitOnCtrlC: false,
      targetFps: 30,
    })

    process.on("SIGINT", () => {
      renderer.destroy()
      stopServer()
      logger.close()
      process.exit(0)
    })

    createRoot(renderer).render(<App serverUrl={serverUrl} />)
    return true
  } catch {
    return false
  }
}

async function repl(serverUrl: string): Promise<void> {
  console.log("scode REPL — type your prompt, or /q to quit")
  const rl = createInterface({ input: stdin, output: stdout, terminal: true })

  rl.on("line", async (line) => {
    const input = line.trim()
    if (!input) { rl.prompt(); return }
    if (input === "/q") { rl.close(); return }
    console.log()
    await sendPrompt(input, serverUrl, (token) => stdout.write(token))
    console.log("\n")
    rl.prompt()
  })

  rl.on("close", () => {
    stopServer()
    logger.close()
    process.exit(0)
  })

  rl.prompt()
}

main().catch((err) => {
  logger.error(`Fatal: ${(err as Error).message}`)
  stopServer()
  logger.close()
  process.exit(1)
})

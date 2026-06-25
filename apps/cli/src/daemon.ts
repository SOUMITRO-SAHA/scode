import { spawn, type ChildProcess } from "node:child_process"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"

const DEFAULT_PORT = 4100
const HEALTH_ENDPOINT = `http://127.0.0.1:${DEFAULT_PORT}/health`
const POLL_INTERVAL = 200
const MAX_POLLS = 25

let serverProcess: ChildProcess | null = null

async function healthCheck(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(1500) })
    return res.ok
  } catch {
    return false
  }
}

export async function findServer(): Promise<string | null> {
  const ok = await healthCheck(HEALTH_ENDPOINT)
  return ok ? `http://127.0.0.1:${DEFAULT_PORT}` : null
}

function resolveServerEntry(): string {
  const cliSrc = dirname(fileURLToPath(import.meta.url))
  return resolve(cliSrc, "../../server/src/index.ts")
}

export async function startServer(): Promise<string> {
  const entry = resolveServerEntry()
  serverProcess = spawn("npx", ["tsx", entry, `--port=${DEFAULT_PORT}`], {
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  })

  serverProcess.stdout?.on("data", (data: Buffer) => {
    const msg = data.toString().trim()
    if (msg) console.error("[server]", msg)
  })

  serverProcess.stderr?.on("data", (data: Buffer) => {
    const msg = data.toString().trim()
    if (msg) console.error("[server]", msg)
  })

  serverProcess.on("exit", (code) => {
    if (code !== 0) console.error(`[server] exited with code ${code}`)
    serverProcess = null
  })

  serverProcess.unref()

  for (let i = 0; i < MAX_POLLS; i++) {
    const ok = await healthCheck(HEALTH_ENDPOINT)
    if (ok) return `http://127.0.0.1:${DEFAULT_PORT}`
    await new Promise((r) => setTimeout(r, POLL_INTERVAL))
  }

  throw new Error("Server failed to start within timeout")
}

export function stopServer(): void {
  if (serverProcess) {
    serverProcess.kill("SIGTERM")
    serverProcess = null
  }
}

export async function ensureServer(): Promise<string> {
  const existing = await findServer()
  if (existing) return existing
  return startServer()
}

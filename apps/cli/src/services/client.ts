import { Logger } from "@scode/shared/logger"
import { processUrl } from "@scode/shared/constants"

const logger = new Logger({ stderr: true })

export async function sendPrompt(
  prompt: string,
  serverUrl: string,
  onToken: (token: string) => void,
  model?: string,
): Promise<string> {
  const url = processUrl(serverUrl)
  logger.debug(`Sending prompt to ${url} (${prompt.slice(0, 60)}...)`)

  const startTime = Date.now()
  const body: Record<string, unknown> = { prompt }
  if (model) body.model = model
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    logger.error(`Server error ${response.status}: ${text}`)
    throw new Error(`Server error ${response.status}: ${text}`)
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error("No response body")

  const decoder = new TextDecoder()
  let full = ""
  const buffer: string[] = []
  let flushTimer: ReturnType<typeof setTimeout> | null = null

  function flush() {
    if (buffer.length > 0) {
      const chunk = buffer.join("")
      buffer.length = 0
      onToken(chunk)
    }
    flushTimer = null
  }

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const text = decoder.decode(value, { stream: true })
      full += text
      buffer.push(text)

      if (!flushTimer) {
        flushTimer = setTimeout(flush, 0)
      }
    }
  } finally {
    reader.releaseLock()
  }

  if (flushTimer) clearTimeout(flushTimer)
  flush()

  const elapsed = Date.now() - startTime
  logger.info(`Response complete (${full.length} chars in ${elapsed}ms)`)

  return full
}

export async function sendPrompt(
  prompt: string,
  serverUrl: string,
  onToken: (token: string) => void,
): Promise<string> {
  const response = await fetch(`${serverUrl}/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  })

  if (!response.ok) {
    const text = await response.text()
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

  return full
}

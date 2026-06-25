import { useState, useCallback } from "react"
import { sendPrompt } from "../services/client.js"
import type { Message } from "../types/index.js"

export function useStreaming(serverUrl: string, model?: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)

  const submit = useCallback((userMsg: string) => {
    if (!userMsg.trim() || loading) return
    setMessages((prev) => [...prev, { role: "user", content: userMsg }, { role: "assistant", content: "" }])
    setLoading(true)
    ;(async () => {
      let full = ""
      try {
        await sendPrompt(userMsg, serverUrl, (token: string) => {
          full += token
          setMessages((prev) => {
            const copy = [...prev]
            copy[copy.length - 1] = { role: "assistant", content: full }
            return copy
          })
        }, model)
      } catch (err) {
        setMessages((prev) => {
          const copy = [...prev]
          copy[copy.length - 1] = { role: "assistant", content: `Error: ${(err as Error).message}` }
          return copy
        })
      } finally {
        setLoading(false)
      }
    })()
  }, [serverUrl, loading, model])

  const clearMessages = useCallback(() => {
    setMessages([])
    setLoading(false)
  }, [])

  return { messages, loading, submit, clearMessages }
}

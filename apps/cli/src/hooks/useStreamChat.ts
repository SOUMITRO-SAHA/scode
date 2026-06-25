import { useRef, useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { apiV1Base } from "@scode/shared/constants"
import { useAppStore } from "../store/index"

const decoder = new TextDecoder()

export function useStreamChat(serverUrl: string) {
  const sessionIdRef = useRef<string | undefined>(undefined)
  const statusRef = useRef<"idle" | "streaming">("idle")
  const qc = useQueryClient()
  const streaming = useAppStore((s) => s.streaming)
  const messages = useAppStore((s) => s.messages)

  const setSessionId = useCallback((id: string | undefined) => { sessionIdRef.current = id }, [])

  const submit = useCallback(async (text: string) => {
    const current = useAppStore.getState()
    if (!text.trim() || current.streaming) return

    useAppStore.getState().addUserMessage(text)
    useAppStore.getState().setStreaming(true)
    statusRef.current = "streaming"

    const base = apiV1Base(serverUrl)
    let sessionId = sessionIdRef.current

    try {
      if (!sessionId) {
        const configRes = await fetch(`${base}/config`)
        const config = await configRes.json() as { defaultModel: string }
        const m = useAppStore.getState().model ?? config.defaultModel
        const sessionRes = await fetch(`${base}/sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: text.slice(0, 60), model: m }),
        })
        const session = await sessionRes.json() as { id: string }
        sessionId = session.id
        sessionIdRef.current = sessionId
        useAppStore.getState().setCurrentSessionId(sessionId)
      }

      const chatRes = await fetch(`${base}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          model: useAppStore.getState().model,
          sessionId,
        }),
      })

      if (!chatRes.ok) {
        const errText = await chatRes.text()
        throw new Error(errText || `HTTP ${chatRes.status}`)
      }

      const reader = chatRes.body?.getReader()
      if (!reader) throw new Error("No response body")

      useAppStore.getState().addAssistantMessage()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        useAppStore.getState().appendAssistantChunk(chunk)
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      useAppStore.getState().setLastAssistantError(errMsg)
    } finally {
      useAppStore.getState().setStreaming(false)
      statusRef.current = "idle"
      qc.invalidateQueries({ queryKey: ["sessions", serverUrl] })
    }
  }, [serverUrl, qc])

  return { messages, streaming, sessionId: sessionIdRef.current, setSessionId, submit }
}

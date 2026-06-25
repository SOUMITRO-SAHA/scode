import { useCallback, useState, useRef, useEffect } from "react"
import { useKeyboard, useRenderer, useTerminalDimensions } from "@opentui/react"
import { sendPrompt } from "./client.js"
import type { ScrollBoxRenderable } from "@opentui/core"

interface Message {
  role: "user" | "assistant"
  content: string
}

export function App({ serverUrl }: { serverUrl: string }) {
  const [prompt, setPrompt] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<ScrollBoxRenderable>(null)
  const renderer = useRenderer()
  const { width, height } = useTerminalDimensions()

  useKeyboard((key) => {
    if (key.ctrl && (key.name === "c" || key.name === "q")) {
      renderer.destroy()
      process.exit(0)
    }
  })

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 99999
  }, [messages])

  const handleSubmit = useCallback((value: string) => {
    if (!value.trim() || loading) return
    const userMsg = value
    setMessages((prev) => [...prev, { role: "user", content: userMsg }, { role: "assistant", content: "" }])
    setPrompt("")
    setLoading(true)
    ;(async () => {
      let full = ""
      try {
        await sendPrompt(userMsg, serverUrl, (token) => {
          full += token
          setMessages((prev) => {
            const copy = [...prev]
            copy[copy.length - 1] = { role: "assistant", content: full }
            return copy
          })
        })
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
  }, [serverUrl, loading])

  return (
    <box flexDirection="column" width={width} height={height}>
      <box height={1} backgroundColor="#1a1a2e" paddingLeft={1}>
        <text fg="#00ff88">  <strong>⚡ scode</strong></text>
        <text fg="#666"> — AI Coding Agent    </text>
        <text fg="#444">Ctrl+Q to quit</text>
      </box>
      <scrollbox flexGrow={1} ref={scrollRef} paddingLeft={1} paddingRight={1}>
        {messages.length === 0 && (
          <text fg="#666">  Type a prompt below and press Enter to start.</text>
        )}
        {messages.map((msg, i) => (
          <text key={i}>
            <text fg={msg.role === "user" ? "#0af" : "#0f8"}>
              <strong>{msg.role === "user" ? "  \u2192 " : "  \u2190 "}</strong>
            </text>
            {msg.content}
            {msg.role === "assistant" && msg.content === "" && loading ? (
              <text fg="#0f8">...</text>
            ) : null}
          </text>
        ))}
      </scrollbox>
      <box height={1} backgroundColor="#1a1a2e" paddingLeft={1}>
        <text fg="#0f8">
          <strong>  {"> "}</strong>
        </text>
        <input
          value={prompt}
          onInput={setPrompt}
          onSubmit={handleSubmit as any}
          placeholder={loading ? "Waiting..." : "Type your prompt..."}
          width={width - 4}
          focused
        />
      </box>
    </box>
  )
}

import { useState, useCallback } from "react"
import { useKeyboard, useRenderer, useTerminalDimensions } from "@opentui/react"
import { Landing } from "./components/Landing.js"
import { Header } from "./components/Header.js"
import { ChatArea } from "./components/ChatArea.js"
import { Composer } from "./components/Composer.js"
import { Footer } from "./components/Footer.js"
import { useStreaming } from "./hooks/useStreaming.js"

export function App({ serverUrl, model }: { serverUrl: string; model?: string }) {
  const { messages, loading, submit, clearMessages } = useStreaming(serverUrl, model)
  const renderer = useRenderer()
  const { width, height } = useTerminalDimensions()
  const [debug, setDebug] = useState(false)
  const hasConversation = messages.length > 0
  const composerLines = height < 20 ? 1 : height < 28 ? 2 : 3

  const handleSubmit = useCallback((value: string) => {
    if (!value.trim() || loading) return
    submit(value)
  }, [submit, loading])

  useKeyboard((key) => {
    if (key.ctrl && key.name === "l") {
      clearMessages()
    } else if (key.ctrl && key.name === "d") {
      setDebug((d) => !d)
    } else if (key.ctrl && (key.name === "c" || key.name === "q")) {
      renderer.destroy()
      process.exit(0)
    }
  })

  if (!hasConversation) {
    return (
      <Landing
        onSubmit={handleSubmit}
        loading={loading}
        width={width}
        height={height}
      />
    )
  }

  return (
    <box flexDirection="column" width={width} height={height}>
      <Header />
      <ChatArea messages={messages} loading={loading} debug={debug} />
      <Composer
        onSubmit={handleSubmit}
        loading={loading}
        width={width}
        lines={composerLines}
      />
      <Footer debug={debug} />
    </box>
  )
}

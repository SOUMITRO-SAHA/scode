import { useState } from "react"
import { useKeyboard, useRenderer, useTerminalDimensions } from "@opentui/react"
import { Header } from "./components/Header.js"
import { MessageList } from "./components/MessageList.js"
import { InputBar } from "./components/InputBar.js"
import { useStreaming } from "./hooks/useStreaming.js"

export function App({ serverUrl }: { serverUrl: string }) {
  const [prompt, setPrompt] = useState("")
  const { messages, loading, submit } = useStreaming(serverUrl)
  const renderer = useRenderer()
  const { width, height } = useTerminalDimensions()

  useKeyboard((key) => {
    if (key.ctrl && (key.name === "c" || key.name === "q")) {
      renderer.destroy()
      process.exit(0)
    }
  })

  return (
    <box flexDirection="column" width={width} height={height}>
      <Header />
      <MessageList messages={messages} loading={loading} />
      <InputBar
        prompt={prompt}
        onInput={setPrompt}
        onSubmit={(value: string) => {
          submit(value)
          setPrompt("")
        }}
        loading={loading}
        width={width}
      />
    </box>
  )
}

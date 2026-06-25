import { useState, useCallback, useRef } from "react"
import { useKeyboard, useRenderer, useTerminalDimensions } from "@opentui/react"
import { theme } from "@scode/theme"
import { Landing } from "./components/Landing.js"
import { Header } from "./components/Header.js"
import { ChatArea } from "./components/ChatArea.js"
import { Composer } from "./components/Composer.js"
import { Footer } from "./components/Footer.js"
import { CommandPalette } from "./components/CommandPalette.js"
import { useStreaming } from "./hooks/useStreaming.js"
import { ApiClient } from "./services/api.js"
import { executeCommand, parseCommand, type Command, type CommandContext } from "./commands/commands.js"

export function App({ serverUrl, model: initialModel }: { serverUrl: string; model?: string }) {
  const { messages, loading, submit, clearMessages, addSystemMessage } = useStreaming(serverUrl)
  const renderer = useRenderer()
  const { width, height } = useTerminalDimensions()
  const [debug, setDebug] = useState(false)
  const [paletteVisible, setPaletteVisible] = useState(false)
  const [currentModel, setCurrentModel] = useState(initialModel)
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>()
  const apiRef = useRef(new ApiClient(serverUrl))
  const hasConversation = messages.length > 0
  const composerLines = height < 20 ? 1 : height < 28 ? 2 : 3

  const toggleDebug = useCallback(() => setDebug((d) => !d), [])

  const handleSubmit = useCallback(
    async (value: string) => {
      if (!value.trim() || loading) return

      const parsed = parseCommand(value)
      if (parsed) {
        const ctx: CommandContext = {
          model: currentModel,
          serverUrl,
          currentSessionId,
          debugEnabled: debug,
          setModel: setCurrentModel,
          setCurrentSessionId,
          clearMessages,
          toggleDebug,
          addSystemMessage,
        }
        const result = await executeCommand(value, apiRef.current, ctx)
        if (result?.type === "message" && result.text) {
          addSystemMessage(result.text)
        }
        return
      }

      submit(value)
    },
    [loading, currentModel, serverUrl, currentSessionId, debug, clearMessages, toggleDebug, addSystemMessage, submit],
  )

  const handlePaletteSelect = useCallback(
    (cmd: Command) => {
      addSystemMessage(`Running /${cmd.name}...`)
      const ctx: CommandContext = {
        model: currentModel,
        serverUrl,
        currentSessionId,
        debugEnabled: debug,
        setModel: setCurrentModel,
        setCurrentSessionId,
        clearMessages,
        toggleDebug,
        addSystemMessage,
      }
      executeCommand(`/${cmd.name}`, apiRef.current, ctx)
    },
    [currentModel, serverUrl, currentSessionId, debug, clearMessages, toggleDebug, addSystemMessage],
  )

  useKeyboard((key) => {
    if (key.ctrl && key.name === "p") {
      setPaletteVisible((v) => !v)
    } else if (key.ctrl && key.name === "l") {
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
      <box flexDirection="column" width={width} height={height}>
        <Landing
          onSubmit={handleSubmit}
          loading={loading}
          width={width}
          height={height}
          modelDisplay={currentModel}
        />
        <CommandPalette
          visible={paletteVisible}
          onClose={() => setPaletteVisible(false)}
          onSelect={handlePaletteSelect}
        />
      </box>
    )
  }

  return (
    <box flexDirection="column" width={width} height={height}>
      <Header modelDisplay={currentModel} sessionId={currentSessionId} />
      <ChatArea messages={messages} loading={loading} debug={debug} />
      <Composer
        onSubmit={handleSubmit}
        loading={loading}
        width={width}
        lines={composerLines}
        modelDisplay={currentModel}
      />
      <Footer debug={debug} />
      <CommandPalette
        visible={paletteVisible}
        onClose={() => setPaletteVisible(false)}
        onSelect={handlePaletteSelect}
      />
    </box>
  )
}

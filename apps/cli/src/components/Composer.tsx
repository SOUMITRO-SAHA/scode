import { useCallback, useRef, useState } from "react"
import type { TextareaRenderable, KeyEvent } from "@opentui/core"
import { theme } from "@scode/theme"

interface ComposerProps {
  onSubmit: (value: string) => void
  streaming: boolean
  width: number
  lines?: number
  placeholder?: string
  modelDisplay?: string
}

export function Composer({
  onSubmit, streaming, width, lines = 3,
  placeholder = "Ask anything...", modelDisplay,
}: ComposerProps) {
  const boxWidth = Math.min(width - 4, 80)
  const inputWidth = boxWidth - 4
  const borderPad = Math.max(0, Math.floor((width - boxWidth) / 2))
  const [composerKey, setComposerKey] = useState(0)
  const [initialVal, setInitialVal] = useState("")
  const ref = useRef<TextareaRenderable | null>(null)
  const historyRef = useRef<string[]>([])
  const draftRef = useRef("")
  const histIdxRef = useRef(-1)

  const goHistory = useCallback((dir: -1 | 1) => {
    const ta = ref.current as any
    const hist = historyRef.current
    if (hist.length === 0) return
    if (dir === -1) {
      if (histIdxRef.current === -1) draftRef.current = ta?.plainText ?? ta?.value ?? ""
      if (histIdxRef.current < hist.length - 1) {
        histIdxRef.current++
        setInitialVal(hist[hist.length - 1 - histIdxRef.current])
        setComposerKey((c) => c + 1)
      }
    } else {
      if (histIdxRef.current === -1) return
      if (histIdxRef.current === 0) {
        histIdxRef.current = -1
        setInitialVal(draftRef.current)
      } else {
        histIdxRef.current--
        setInitialVal(hist[hist.length - 1 - histIdxRef.current])
      }
      setComposerKey((c) => c + 1)
    }
  }, [])

  const handleKeyDown = useCallback((event: KeyEvent) => {
    if (event.name === "up") { goHistory(-1); return }
    if (event.name === "down") { goHistory(1); return }
  }, [goHistory])

  const handleSubmit = useCallback(() => {
    const ta = ref.current as any
    const val = (ta?.plainText ?? ta?.value ?? "").trim()
    if (!val || streaming) return
    historyRef.current.push(val)
    histIdxRef.current = -1
    draftRef.current = ""
    onSubmit(val)
    setInitialVal("")
    setComposerKey((c) => c + 1)
  }, [onSubmit, streaming])

  const isCommand = initialVal.trim().startsWith("/")

  return (
    <box paddingLeft={borderPad} paddingRight={borderPad} paddingBottom={1}>
      <box
        borderStyle="rounded"
        borderColor={isCommand ? theme.brand.primary : theme.chat.user.border}
        width={boxWidth}
        flexDirection="column"
      >
        <textarea
          key={composerKey}
          ref={ref}
          initialValue={initialVal}
          onSubmit={handleSubmit}
          onKeyDown={handleKeyDown}
          placeholder={streaming ? "Waiting..." : placeholder}
          width={inputWidth}
          height={lines}
          focused
          keyBindings={[{ name: "return", action: "submit" }]}
          backgroundColor="transparent"
          focusedBackgroundColor="transparent"
          textColor={theme.text.primary}
          placeholderColor={theme.text.disabled}
        />
        <box height={1} paddingLeft={1}>
          {isCommand ? (
            <text fg={theme.brand.primary}>Command</text>
          ) : (
            <text fg={theme.text.disabled}>
              {modelDisplay ?? "scode"} | {streaming ? "Processing..." : "Ready"}
            </text>
          )}
        </box>
      </box>
    </box>
  )
}

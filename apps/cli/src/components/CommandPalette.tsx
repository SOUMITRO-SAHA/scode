import { useState, useCallback, useRef, useEffect } from "react"
import { useKeyboard } from "@opentui/react"
import { theme } from "@scode/theme"
import { COMMANDS, type Command } from "../commands/commands"

interface CommandPaletteProps {
  visible: boolean
  onClose: () => void
  onSelect: (cmd: Command) => void
}

export function CommandPalette({ visible, onClose, onSelect }: CommandPaletteProps) {
  const [query, setQuery] = useState("")
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef = useRef<any>(null)

  useEffect(() => {
    if (visible) {
      setQuery("")
      setSelectedIdx(0)
      setTimeout(() => inputRef.current?.focus?.(), 50)
    }
  }, [visible])

  const filtered = query.trim()
    ? COMMANDS.filter(
        (c) =>
          c.name.includes(query.toLowerCase()) ||
          c.aliases.some((a) => a.includes(query.toLowerCase())) ||
          c.category.includes(query.toLowerCase()),
      )
    : COMMANDS

  useEffect(() => {
    setSelectedIdx(0)
  }, [filtered.length])

  const handleKey = useCallback(
    (event: any) => {
      if (!visible) return
      if (event.name === "down" || (event.ctrl && event.name === "n")) {
        setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1))
      } else if (event.name === "up" || (event.ctrl && event.name === "p")) {
        setSelectedIdx((i) => Math.max(i - 1, 0))
      } else if (event.name === "return") {
        if (filtered[selectedIdx]) {
          onSelect(filtered[selectedIdx])
          onClose()
        }
      } else if (event.name === "escape") {
        onClose()
      }
    },
    [visible, filtered, selectedIdx, onSelect, onClose],
  )

  useKeyboard(handleKey)

  if (!visible) return null

  const cols = process.stdout.columns ?? 80
  const rows = process.stdout.rows ?? 24

  const categories = [...new Set(filtered.map((c) => c.category))]

  return (
    <box
      position="absolute"
      left={Math.floor(cols / 4)}
      top={Math.floor(rows / 3)}
      width={Math.floor(cols / 2)}
      height={Math.min(filtered.length + 4, 22)}
      borderStyle="rounded"
      borderColor={theme.text.muted}
      backgroundColor={theme.background.primary}
      flexDirection="column"
    >
      <text fg={theme.text.disabled} paddingLeft={1}>{">"}</text>
      <input
        ref={inputRef}
        value={query}
        onChange={(v: string) => setQuery(v)}
        placeholder="Search commands..."
        width="100%"
        focused
      />
      <scrollbox flexGrow={1}>
        {categories.map((cat) => {
          const catCmds = filtered.filter((c) => c.category === cat)
          if (catCmds.length === 0) return null
          return (
            <box key={cat} flexDirection="column">
              <text fg={theme.text.muted} paddingLeft={1}>{cat}</text>
              {catCmds.slice(0, 12).map((cmd) => {
                const idx = filtered.indexOf(cmd)
                return (
                  <box
                    key={cmd.name}
                    backgroundColor={idx === selectedIdx ? theme.background.secondary : "transparent"}
                    height={1}
                    paddingLeft={2}
                  >
                    <text fg={idx === selectedIdx ? theme.brand.primary : theme.text.primary}>
                      /{cmd.name}
                    </text>
                    <text fg={theme.text.muted}>{`  ${cmd.description.slice(0, 50)}`}</text>
                  </box>
                )
              })}
            </box>
          )
        })}
      </scrollbox>
    </box>
  )
}

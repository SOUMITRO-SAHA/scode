import { useState, useCallback, useRef, useEffect } from "react"
import { useKeyboard } from "@opentui/react"
import { theme } from "@scode/theme"
import { COMMANDS, type Command } from "../commands/commands.js"

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

  const handleKey = useCallback(
    (event: any) => {
      if (!visible) return
      if (event.name === "down") {
        setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1))
      } else if (event.name === "up") {
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

  return (
    <box
      position="absolute"
      left={Math.floor(cols / 4)}
      top={Math.floor(rows / 3)}
      width={Math.floor(cols / 2)}
      height={Math.min(filtered.length + 3, 20)}
      borderStyle="rounded"
      borderColor={theme.text.muted}
      backgroundColor={theme.background.primary}
      flexDirection="column"
    >
      <text fg={theme.text.disabled} paddingLeft={1}>  {" >"} </text>
      <input
        ref={inputRef}
        value={query}
        onChange={(v: string) => { setQuery(v); setSelectedIdx(0) }}
        placeholder="Search commands..."
        width="100%"
        focused
      />
      <box flexDirection="column" height={filtered.length}>
        {filtered.slice(0, 15).map((cmd, i) => (
          <box
            key={cmd.name}
            backgroundColor={i === selectedIdx ? theme.background.secondary : "transparent"}
            height={1}
            paddingLeft={1}
          >
            <text
              fg={i === selectedIdx ? theme.brand.primary : theme.text.primary}
            >
              {`/${cmd.name}`}
            </text>
            <text fg={theme.text.muted}>{`  — ${cmd.description.slice(0, 50)}`}</text>
          </box>
        ))}
      </box>
    </box>
  )
}

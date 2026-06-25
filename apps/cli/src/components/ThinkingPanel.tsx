import { theme } from "@scode/theme"

export function ThinkingPanel({ debug }: { debug?: boolean }) {
  if (!debug) return null
  return (
    <box borderStyle="rounded" borderColor={theme.brand.primary} padding={1} marginTop={1}>
      <text fg={theme.text.muted}>Debug: processing...</text>
      <text fg={theme.text.disabled}>Ctrl+D toggle</text>
    </box>
  )
}

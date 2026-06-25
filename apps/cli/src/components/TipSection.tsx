import { useTips } from "../hooks/useTips.js"
import { theme } from "../styles/theme.js"

export function TipSection({ show = true }: { show?: boolean }) {
  const tip = useTips()

  if (!show) return null

  return (
    <box flexDirection="column" alignItems="center" paddingTop={1}>
      <text fg={theme.muted}>{tip}</text>
    </box>
  )
}

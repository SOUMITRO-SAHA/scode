import { useTips } from "../hooks/useTips"
import { theme } from "@scode/theme"

export function TipSection({ show = true }: { show?: boolean }) {
  const tip = useTips()
  if (!show) return null
  return (
    <box flexDirection="column" alignItems="center" paddingTop={1}>
      <text fg={theme.text.muted}>{tip}</text>
    </box>
  )
}

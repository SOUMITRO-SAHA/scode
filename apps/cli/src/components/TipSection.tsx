import { useTips } from "../hooks/useTips.js"
import { theme } from "../styles/theme.js"

export function TipSection() {
  const tip = useTips()

  return (
    <box flexDirection="column" alignItems="center" paddingTop={1}>
      <text fg={theme.muted}>  {tip}</text>
    </box>
  )
}

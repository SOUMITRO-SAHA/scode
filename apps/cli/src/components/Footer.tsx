import { theme } from "@scode/theme"
import { useAppStore } from "../store/index"

export function Footer() {
  const debug = useAppStore((s) => s.debug)

  return (
    <box height={1} paddingLeft={1} paddingRight={1}>
      <text fg={theme.text.disabled}>
        Ctrl+C Quit  Ctrl+L Clear  Ctrl+P Palette  Ctrl+S Sessions  {debug ? "DBG ON" : "Ctrl+D Debug"}  /help
      </text>
    </box>
  )
}

import { theme } from "../styles/theme.js"

export function Footer({ debug }: { debug?: boolean }) {
  return (
    <box height={1} paddingLeft={1} paddingRight={1}>
      <text fg={theme.dim}>
        Ctrl+C Exit    Ctrl+L Clear    {debug ? <text fg={theme.accent}>DBG ON</text> : "Ctrl+D Debug"}    /help
      </text>
    </box>
  )
}

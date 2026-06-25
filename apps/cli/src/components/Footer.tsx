import { theme } from "../styles/theme.js"

export function Footer({ debug }: { debug?: boolean }) {
  const debugHint = debug
    ? <span fg={theme.accent}>DBG ON</span>
    : <span fg={theme.dim}>Ctrl+D Debug</span>

  return (
    <box height={1} paddingLeft={1} paddingRight={1}>
      <text fg={theme.dim}>
        Ctrl+C Exit    Ctrl+L Clear    {debugHint}    /help
      </text>
    </box>
  )
}

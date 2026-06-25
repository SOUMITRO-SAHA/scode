import { theme } from "@scode/theme"

export function Footer({ debug }: { debug?: boolean }) {
  const debugHint = debug
    ? <span fg={theme.brand.primary}>DBG ON</span>
    : <span fg={theme.text.disabled}>Ctrl+D Debug</span>

  return (
    <box height={1} paddingLeft={1} paddingRight={1}>
      <text fg={theme.text.disabled}>
        Ctrl+C Exit    Ctrl+L Clear    Ctrl+P Palette    {debugHint}    /help
      </text>
    </box>
  )
}

import { theme } from "../styles/theme.js"

export function Header() {
  return (
    <box height={1} backgroundColor={theme.headerBg} paddingLeft={1} paddingRight={1}>
      <box flexDirection="row" width="100%" justifyContent="space-between">
        <text fg={theme.accent}><strong>  SCode</strong></text>
        <text fg={theme.muted}>Claude Sonnet  Local Server</text>
      </box>
    </box>
  )
}

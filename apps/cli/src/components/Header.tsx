import { theme } from "@scode/theme"

export function Header() {
  return (
    <box height={1} backgroundColor={theme.background.secondary} paddingLeft={1} paddingRight={1}>
      <box flexDirection="row" width="100%" justifyContent="space-between">
        <text fg={theme.brand.primary}><strong>  SCode</strong></text>
        <text fg={theme.text.muted}>Claude Sonnet  Local Server</text>
      </box>
    </box>
  )
}

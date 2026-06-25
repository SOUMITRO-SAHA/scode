import { theme } from "@scode/theme"

interface HeaderProps {
  modelDisplay?: string
  sessionId?: string
}

export function Header({ modelDisplay, sessionId }: HeaderProps) {
  const sessionTag = sessionId ? ` ${sessionId.slice(0, 8)}` : ""
  return (
    <box height={1} backgroundColor={theme.background.secondary} paddingLeft={1} paddingRight={1}>
      <box flexDirection="row" width="100%" justifyContent="space-between">
        <text fg={theme.brand.primary}><strong>  SCode{sessionTag}</strong></text>
        <text fg={theme.text.muted}>
          {modelDisplay ?? "scode"}
          {"  "}Local Server
        </text>
      </box>
    </box>
  )
}

import { theme } from "@scode/theme"
import { useHealth } from "../hooks/useApi"
import { useAppStore } from "../store/index"

interface HeaderProps {
  modelDisplay?: string
  sessionName?: string
}

export function Header({ modelDisplay, sessionName }: HeaderProps) {
  const serverUrl = useAppStore((s) => s.serverUrl)
  const sidebarVisible = useAppStore((s) => s.sidebarVisible)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)
  const { data: health } = useHealth(serverUrl)
  const connected = health?.healthy

  return (
    <box
      height={1}
      backgroundColor={theme.background.secondary}
      paddingLeft={1}
      paddingRight={1}
    >
      <box flexDirection="row" width="100%" justifyContent="space-between">
        <box flexDirection="row">
          <box onMouseDown={toggleSidebar}>
            <text fg={theme.text.disabled}>☰</text>
          </box>
          <text fg={theme.brand.primary} paddingLeft={1}>
            <strong>SCode</strong>
          </text>
          {sessionName && (
            <text fg={theme.text.muted} paddingLeft={1}>
              | {sessionName.slice(0, 24)}
            </text>
          )}
        </box>
        <box flexDirection="row">
          <text fg={connected ? theme.success : theme.danger}>
            {connected ? "●" : "○"}
          </text>
          <text fg={theme.text.muted} paddingLeft={1}>
            {modelDisplay ?? "scode"}
          </text>
        </box>
      </box>
    </box>
  )
}

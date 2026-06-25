import { theme } from "../styles/theme.js"

export function Header() {
  return (
    <box height={1} backgroundColor={theme.headerBg} paddingLeft={1}>
      <text fg={theme.accent}>  <strong>⚡ scode</strong></text>
      <text fg={theme.muted}> — AI Coding Agent    </text>
      <text fg={theme.dim}>Ctrl+Q to quit</text>
    </box>
  )
}

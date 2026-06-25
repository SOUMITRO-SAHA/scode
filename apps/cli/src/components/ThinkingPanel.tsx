import { theme } from "../styles/theme.js"

export function ThinkingPanel({ debug }: { debug?: boolean }) {
  return (
    <box flexDirection="column" paddingLeft={2} paddingTop={1}>
      <text fg={theme.accent}>Processing...</text>
      {debug && (
        <box flexDirection="column" paddingLeft={1}>
          <text fg={theme.muted}>Reading Skills...</text>
          <text fg={theme.muted}>  welcome-me</text>
          <text fg={theme.muted}>  documentation</text>
          <text fg={theme.muted}>Building Prompt...</text>
          <text fg={theme.muted}>Calling Claude...</text>
          <text fg={theme.muted}>Streaming Response...</text>
        </box>
      )}
    </box>
  )
}

import { theme } from "@scode/theme"

export function ThinkingPanel({ debug }: { debug?: boolean }) {
  return (
    <box flexDirection="column" paddingLeft={2} paddingTop={1}>
      <text fg={theme.chat.thinking}>Processing...</text>
      {debug && (
        <box flexDirection="column" paddingLeft={1}>
          <text fg={theme.text.muted}>Reading Skills...</text>
          <text fg={theme.text.muted}>  welcome-me</text>
          <text fg={theme.text.muted}>  documentation</text>
          <text fg={theme.text.muted}>Building Prompt...</text>
          <text fg={theme.text.muted}>Calling Claude...</text>
          <text fg={theme.text.muted}>Streaming Response...</text>
        </box>
      )}
    </box>
  )
}

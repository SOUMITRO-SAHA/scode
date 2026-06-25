import { theme } from "../styles/theme.js"

export function UserMessage({ content }: { content: string }) {
  return (
    <box
      borderStyle="rounded"
      borderColor={theme.user}
      paddingX={1}
      paddingY={1}
      marginLeft={4}
    >
      <box flexDirection="row" justifyContent="flex-end">
        <text fg={theme.user}>You</text>
      </box>
      <text fg="#E6EDF3">{content}</text>
    </box>
  )
}

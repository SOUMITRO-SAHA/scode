import { theme } from "@scode/theme";

export function UserMessage({ content }: { content: string }) {
  return (
    <box
      borderStyle="rounded"
      borderColor={theme.chat.user.border}
      paddingLeft={1}
      paddingRight={1}
      paddingTop={1}
      paddingBottom={1}
      marginLeft={6}
      marginRight={2}
      backgroundColor={theme.chat.user.background}
    >
      <box flexDirection="row" justifyContent="flex-end">
        <text fg={theme.chat.user.border}>You</text>
      </box>
      <text fg={theme.chat.user.text}>{content}</text>
    </box>
  );
}

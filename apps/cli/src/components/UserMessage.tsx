import { theme } from "@scode/theme";

export function UserMessage({ content }: { content: string }) {
  return (
    <box
      borderStyle="rounded"
      borderColor={theme.chat.user.border}
      paddingX={1}
      paddingY={1}
      marginLeft={4}
      backgroundColor={theme.chat.user.background}
    >
      <box flexDirection="row" justifyContent="flex-end">
        <text fg={theme.chat.user.border}>You</text>
      </box>
      <text fg={theme.chat.user.text}>{content}</text>
    </box>
  );
}

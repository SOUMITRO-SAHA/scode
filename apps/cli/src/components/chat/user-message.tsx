import { Effect } from "effect";

import { formatTime } from "@scode/shared/utils";
import { theme } from "@scode/theme";

export function UserMessage({ content }: { content: string }) {
  const timestamp = Effect.runSync(formatTime(new Date()));

  return (
    <box
      borderStyle="rounded"
      borderColor={theme.chat.user.border}
      paddingLeft={1}
      paddingRight={1}
      paddingTop={0}
      paddingBottom={0}
      minHeight={3}
    >
      <text fg={theme.chat.user.text}>{content}</text>
      <text fg={theme.chat.user.timestamp}>{timestamp}</text>
    </box>
  );
}

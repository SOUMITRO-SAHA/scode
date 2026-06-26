import { useMemo } from "react";

import { getMarkdownStyle } from "@/styles/syntaxTheme";
import { theme } from "@scode/theme";

export function AssistantMessage({
  content,
  isStreaming,
}: {
  content: string;
  isStreaming: boolean;
}) {
  const style = useMemo(() => getMarkdownStyle(), []);

  if (!content && !isStreaming) return null;

  return (
    <box paddingLeft={2} paddingRight={2} paddingTop={1} paddingBottom={1}>
      <box flexDirection="column">
        {!content && isStreaming ? (
          <text fg={theme.text.muted}>Thinking...</text>
        ) : (
          <markdown
            content={content}
            syntaxStyle={style}
            streaming={isStreaming}
            conceal
            tableOptions={{
              style: "grid",
              borderStyle: "single",
              borderColor: theme.markdown.tableBorder,
              cellPadding: 1,
            }}
          />
        )}
      </box>
    </box>
  );
}

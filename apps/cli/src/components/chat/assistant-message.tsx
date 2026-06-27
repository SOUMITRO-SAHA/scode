import { useMemo } from "react";

import { ThinkingDisplay } from "@/components/feedback/thinking-display.js";
import { useAppStore } from "@/store/index";
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
  const thought = useAppStore((s) => s.thought);
  const thoughtStartTime = useAppStore((s) => s.thoughtStartTime);
  const streaming = useAppStore((s) => s.streaming);

  if (!content && !isStreaming) return null;

  return (
    <box paddingTop={1} paddingBottom={1}>
      <box flexDirection="column">
        {thought || (isStreaming && !content) ? (
          <ThinkingDisplay
            thought={thought}
            thoughtStartTime={thoughtStartTime}
            streaming={streaming}
          />
        ) : null}
        {content ? (
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
        ) : null}
      </box>
    </box>
  );
}

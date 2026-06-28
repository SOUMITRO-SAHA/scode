import { useMemo } from "react";

import { ToolCallDisplay } from "./tool-call-display";

import { ThinkingDisplay } from "@/components/feedback/thinking-display";
import { useAppStore } from "@/store/index";
import { getMarkdownStyle } from "@/styles/syntaxTheme";
import type { ToolCallState } from "@scode/shared/types";
import { theme } from "@scode/theme";

export function AssistantMessage({
  content,
  isStreaming,
  toolCalls,
  thought: msgThought,
}: {
  content: string;
  isStreaming: boolean;
  toolCalls?: ToolCallState[];
  thought?: string;
}) {
  const style = useMemo(() => getMarkdownStyle(), []);
  const storeThought = useAppStore((s) => s.thought);
  const thoughtStartTime = useAppStore((s) => s.thoughtStartTime);
  const streaming = useAppStore((s) => s.streaming);
  const thought = msgThought ?? storeThought;

  if (!content && !isStreaming && (!toolCalls || toolCalls.length === 0))
    return null;

  return (
    <box paddingTop={0.5} paddingBottom={0.5} paddingLeft={2}>
      <box flexDirection="column">
        {thought || (isStreaming && !content) ? (
          <ThinkingDisplay
            thought={thought}
            thoughtStartTime={thoughtStartTime}
            streaming={streaming}
          />
        ) : null}
        {toolCalls && toolCalls.length > 0 && (
          <ToolCallDisplay toolCalls={toolCalls} isStreaming={isStreaming} />
        )}
        {content ? (
          content.startsWith("Error: ") ? (
            <text fg={theme.danger}>{content}</text>
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
          )
        ) : null}
      </box>
    </box>
  );
}

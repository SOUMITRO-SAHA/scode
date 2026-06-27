import { useEffect, useRef } from "react";

import { AssistantMessage } from "./assistant-message";
import { UserMessage } from "./user-message";

import type { ScrollBoxRenderable } from "@opentui/core";
import type { Message } from "@scode/shared/types";
import { theme } from "@scode/theme";

export function ChatArea({
  messages,
  streaming,
}: {
  messages: Message[];
  streaming: boolean;
}) {
  const scrollRef = useRef<ScrollBoxRenderable>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 99999;
  }, [messages]);

  if (messages.length === 0) {
    return (
      <box flexGrow={1} alignItems="center" justifyContent="center">
        <text fg={theme.text.disabled}>
          No messages yet. Type something below to start.
        </text>
      </box>
    );
  }

  return (
    <scrollbox
      flexGrow={1}
      ref={scrollRef}
      paddingTop={1}
      paddingBottom={1}
      stickyScroll
      stickyStart="bottom"
    >
      {messages.map((msg, i) =>
        msg.role === "user" ? (
          <UserMessage key={i} content={msg.content} />
        ) : msg.role === "system" ? (
          <box key={i} paddingTop={1} paddingBottom={1}>
            <text fg={theme.text.muted}>{msg.content}</text>
          </box>
        ) : (
          <AssistantMessage
            key={i}
            content={msg.content}
            isStreaming={
              streaming && i === messages.length - 1 && msg.content === ""
            }
          />
        ),
      )}
    </scrollbox>
  );
}

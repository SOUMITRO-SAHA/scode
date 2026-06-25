import { useRef, useEffect } from "react"
import type { ScrollBoxRenderable } from "@opentui/core"
import type { Message } from "../types/index.js"
import { UserMessage } from "./UserMessage.js"
import { AssistantMessage } from "./AssistantMessage.js"
import { ThinkingPanel } from "./ThinkingPanel.js"

export function ChatArea({ messages, loading, debug }: { messages: Message[]; loading: boolean; debug?: boolean }) {
  const scrollRef = useRef<ScrollBoxRenderable>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 99999
  }, [messages])

  return (
    <scrollbox flexGrow={1} ref={scrollRef} paddingLeft={1} paddingRight={1}>
      {messages.map((msg, i) => (
        msg.role === "user" ? (
          <UserMessage key={i} content={msg.content} />
        ) : (
          <AssistantMessage key={i} content={msg.content} isStreaming={loading && i === messages.length - 1} />
        )
      ))}
      {loading && messages.length > 0 && messages[messages.length - 1].content === "" && (
        <ThinkingPanel debug={debug} />
      )}
    </scrollbox>
  )
}

import { useRef, useEffect } from "react"
import type { ScrollBoxRenderable } from "@opentui/core"
import type { Message } from "../types/index.js"
import { theme } from "../styles/theme.js"
import { MessageItem } from "./MessageItem.js"

export function MessageList({ messages, loading }: { messages: Message[]; loading: boolean }) {
  const scrollRef = useRef<ScrollBoxRenderable>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 99999
  }, [messages])

  return (
    <scrollbox flexGrow={1} ref={scrollRef} paddingLeft={1} paddingRight={1}>
      {messages.length === 0 && (
        <text fg={theme.muted}>  Type a prompt below and press Enter to start.</text>
      )}
      {messages.map((msg, i) => (
        <MessageItem key={i} msg={msg} isStreaming={loading} />
      ))}
    </scrollbox>
  )
}

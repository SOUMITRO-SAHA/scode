import type { Message } from "../types/index.js"
import { theme } from "../styles/theme.js"

export function MessageItem({ msg, isStreaming }: { msg: Message; isStreaming: boolean }) {
  return (
    <text>
      <text fg={msg.role === "user" ? theme.user : theme.assistant}>
        <strong>{msg.role === "user" ? "  \u2192 " : "  \u2190 "}</strong>
      </text>
      {msg.content}
      {msg.role === "assistant" && msg.content === "" && isStreaming ? (
        <text fg={theme.assistant}>...</text>
      ) : null}
    </text>
  )
}

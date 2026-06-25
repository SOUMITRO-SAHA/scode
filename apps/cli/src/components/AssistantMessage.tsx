import { useMemo } from "react"
import { getMarkdownStyle } from "../styles/syntaxTheme.js"

export function AssistantMessage({ content, isStreaming }: { content: string; isStreaming: boolean }) {
  const style = useMemo(() => getMarkdownStyle(), [])

  return (
    <markdown
      content={content}
      syntaxStyle={style}
      streaming={isStreaming}
      conceal
      tableOptions={{
        style: "grid",
        borderStyle: "single",
        borderColor: "#6b7280",
        cellPadding: 1,
      }}
    />
  )
}

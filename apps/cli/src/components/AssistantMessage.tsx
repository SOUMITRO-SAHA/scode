import { markdownStyle } from "../styles/syntaxTheme.js"

export function AssistantMessage({ content, isStreaming }: { content: string; isStreaming: boolean }) {
  return (
    <markdown
      content={content}
      syntaxStyle={markdownStyle}
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

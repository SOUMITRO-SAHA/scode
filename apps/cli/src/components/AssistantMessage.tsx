import { useMemo } from "react"
import { theme } from "@scode/theme"
import { getMarkdownStyle } from "../styles/syntaxTheme"

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
        borderColor: theme.markdown.tableBorder,
        cellPadding: 1,
      }}
    />
  )
}

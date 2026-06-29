import { useMemo } from "react";

import { getMarkdownStyle } from "../../styles/syntaxTheme";

import { theme } from "@scode/theme";

const TASK_CHECKED = "☑";
const TASK_UNCHECKED = "☐";

const CALLOUT_ICONS: Record<string, string> = {
  note: "ℹ",
  tip: "💡",
  important: "❗",
  warning: "⚠",
  caution: "🚨",
};

function preprocessTaskLists(content: string): string {
  return content.replace(/^(\s*)- \[([ xX])\]\s*/gm, (_, indent, checked) => {
    const marker =
      checked.toLowerCase() === "x" ? TASK_CHECKED : TASK_UNCHECKED;
    return `${indent}${marker} `;
  });
}

function preprocessCallouts(content: string): string {
  return content.replace(
    /> \[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/gi,
    (match, type) => {
      const lowerType = type.toLowerCase();
      const icon = CALLOUT_ICONS[lowerType] || CALLOUT_ICONS.note;
      return `> ${icon} **${type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}**: `;
    },
  );
}

function preprocessDiffBlocks(content: string): string {
  return content;
}

export function preprocessMarkdown(content: string): string {
  let processed = content;
  processed = preprocessTaskLists(processed);
  processed = preprocessCallouts(processed);
  processed = preprocessDiffBlocks(processed);
  return processed;
}

interface MarkdownRendererProps {
  content: string;
  streaming?: boolean;
}

export function MarkdownRenderer({
  content,
  streaming,
}: MarkdownRendererProps) {
  const style = useMemo(() => getMarkdownStyle(), []);
  const processedContent = useMemo(
    () => preprocessMarkdown(content),
    [content],
  );

  return (
    <markdown
      content={processedContent}
      syntaxStyle={style}
      streaming={streaming}
      conceal
      tableOptions={{
        style: "grid",
        borderStyle: "single",
        borderColor: theme.markdown.tableBorder,
        cellPadding: 1,
      }}
    />
  );
}

export { getMarkdownStyle };

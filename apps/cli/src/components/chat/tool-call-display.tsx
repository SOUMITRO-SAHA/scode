import { useMemo } from "react";

import type { ToolCallState } from "@scode/shared/types";
import { theme } from "@scode/theme";

const TOOL_LABELS: Record<string, string> = {
  read: "Read",
  write: "Write",
  edit: "Edit",
  bash: "Bash",
  grep: "Grep",
  glob: "Glob",
  skill: "Skill",
  task: "Task",
  webfetch: "Fetch",
  websearch: "Search",
};

function getToolLabel(name: string): string {
  return TOOL_LABELS[name] ?? name;
}

function formatToolInput(input: Record<string, unknown>): string {
  const keys = Object.keys(input);
  if (keys.length === 0) return "";

  const first = input[keys[0]];
  if (typeof first === "string") {
    const display = first.includes("/")
      ? (first.split("/").pop() ?? first)
      : first;
    return display.length > 40 ? display.slice(0, 37) + "..." : display;
  }
  return "";
}

function ToolCallItem({ toolCall }: { toolCall: ToolCallState }) {
  const label = useMemo(() => getToolLabel(toolCall.name), [toolCall.name]);
  const inputPreview = useMemo(
    () => formatToolInput(toolCall.input),
    [toolCall.input],
  );

  const statusColor = useMemo(() => {
    switch (toolCall.status) {
      case "running":
        return theme.chat.tool.iconRunning;
      case "completed":
        return theme.chat.tool.iconSuccess;
      case "failed":
        return theme.chat.tool.iconError;
    }
  }, [toolCall.status]);

  const statusIcon = useMemo(() => {
    switch (toolCall.status) {
      case "running":
        return "~";
      case "completed":
        return "\u{2714}";
      case "failed":
        return "\u{2716}";
    }
  }, [toolCall.status]);

  return (
    <box flexDirection="column" paddingLeft={2}>
      <box flexDirection="row">
        <text width={2} fg={statusColor}>
          {statusIcon}
        </text>
        <text fg={theme.chat.tool.label}>{label}</text>
        {inputPreview && (
          <text fg={theme.chat.tool.input}> {inputPreview}</text>
        )}
      </box>
      {toolCall.status === "failed" && toolCall.result && (
        <box paddingLeft={2}>
          <text fg={theme.chat.tool.resultError}>
            {toolCall.result.length > 120
              ? toolCall.result.slice(0, 117) + "..."
              : toolCall.result}
          </text>
        </box>
      )}
    </box>
  );
}

export function ToolCallDisplay({
  toolCalls,
}: {
  toolCalls: ToolCallState[];
  isStreaming: boolean;
}) {
  if (!toolCalls || toolCalls.length === 0) return null;

  return (
    <box flexDirection="column" paddingBottom={0.5}>
      {toolCalls.map((tc) => (
        <ToolCallItem key={tc.id} toolCall={tc} />
      ))}
    </box>
  );
}

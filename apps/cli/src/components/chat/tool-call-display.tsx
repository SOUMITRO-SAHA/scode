import { useMemo } from "react";

import type { ToolCallState } from "@scode/shared/types";
import { theme } from "@scode/theme";

const TOOL_ICONS: Record<string, string> = {
  read: "\u{1F4C4}",
  write: "\u{1F4DD}",
  edit: "\u{270F}",
  bash: "\u{1F4BB}",
  grep: "\u{1F50D}",
  glob: "\u{1F4C2}",
  skill: "\u{1F3AF}",
  task: "\u{1F916}",
  webfetch: "\u{1F310}",
  websearch: "\u{1F50E}",
};

function getToolIcon(name: string): string {
  return TOOL_ICONS[name] ?? "\u{1F527}";
}

function formatToolInput(input: Record<string, unknown>): string {
  const keys = Object.keys(input);
  if (keys.length === 0) return "";

  const first = input[keys[0]];
  if (typeof first === "string") {
    return first.length > 60 ? first.slice(0, 57) + "..." : first;
  }
  return JSON.stringify(first).slice(0, 50);
}

function truncateResult(result: string, maxLen: number): string {
  if (result.length <= maxLen) return result;
  return result.slice(0, maxLen - 1) + "\u{2026}";
}

export function ToolCallDisplay({
  toolCalls,
  isStreaming,
}: {
  toolCalls: ToolCallState[];
  isStreaming: boolean;
}) {
  if (!toolCalls || toolCalls.length === 0) return null;

  return (
    <box flexDirection="column" paddingTop={0.5} paddingBottom={0.5}>
      {toolCalls.map((tc) => (
        <ToolCallItem key={tc.id} toolCall={tc} isStreaming={isStreaming} />
      ))}
    </box>
  );
}

function ToolCallItem({
  toolCall,
  isStreaming,
}: {
  toolCall: ToolCallState;
  isStreaming: boolean;
}) {
  const icon = useMemo(() => getToolIcon(toolCall.name), [toolCall.name]);
  const inputPreview = useMemo(
    () => formatToolInput(toolCall.input),
    [toolCall.input],
  );

  const statusIcon = useMemo(() => {
    switch (toolCall.status) {
      case "running":
        return "\u{25CB}";
      case "completed":
        return "\u{2714}";
      case "failed":
        return "\u{2716}";
    }
  }, [toolCall.status]);

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

  const labelColor = useMemo(() => {
    switch (toolCall.status) {
      case "running":
        return theme.chat.tool.labelRunning;
      case "completed":
        return theme.chat.tool.labelMuted;
      case "failed":
        return theme.chat.tool.iconError;
    }
  }, [toolCall.status]);

  const label = useMemo(() => {
    switch (toolCall.status) {
      case "running":
        return `${toolCall.name}...`;
      case "completed":
        return toolCall.name;
      case "failed":
        return `${toolCall.name} failed`;
    }
  }, [toolCall.name, toolCall.status]);

  const resultPreview = useMemo(() => {
    if (!toolCall.result) return null;
    if (toolCall.isError) {
      return (
        <box paddingTop={0.5} paddingLeft={2}>
          <text fg={theme.chat.tool.resultError}>
            {truncateResult(toolCall.result, 120)}
          </text>
        </box>
      );
    }
    return null;
  }, [toolCall.result, toolCall.isError]);

  return (
    <box flexDirection="column" paddingLeft={2}>
      <box flexDirection="row">
        <text width={2} fg={statusColor}>
          {statusIcon}
        </text>
        <text width={1} fg={theme.chat.tool.icon}>
          {icon}
        </text>
        <text fg={labelColor}>{label}</text>
        {inputPreview && (
          <text fg={theme.chat.tool.input}> {inputPreview}</text>
        )}
      </box>
      {resultPreview}
    </box>
  );
}

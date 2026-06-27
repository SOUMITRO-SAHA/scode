import { AGENT_LABELS, type AgentId } from "../../store/index";

import type { EffortLevel } from "@scode/shared/types";
import { theme } from "@scode/theme";

const AGENT_COLORS: Record<string, string> = {
  plan: theme.warning,
  write: theme.success,
  chat: theme.brand.primary,
};

interface ComposerFooterProps {
  isCommand: boolean;
  currentAgent: AgentId;
  effortLevel: EffortLevel;
  onCycleEffort: () => void;
  modelName: string;
  providerName: string;
  hasModel: boolean;
  streaming: boolean;
}

export function ComposerFooter({
  isCommand,
  currentAgent,
  effortLevel,
  onCycleEffort,
  modelName,
  providerName,
  hasModel,
  streaming,
}: ComposerFooterProps) {
  if (isCommand) {
    return (
      <box height={1} paddingLeft={1}>
        <text fg={theme.brand.primary}>Command</text>
      </box>
    );
  }

  return (
    <box height={1} paddingLeft={1}>
      <box flexDirection="row">
        <text fg={AGENT_COLORS[currentAgent]}>
          {AGENT_LABELS[currentAgent]}
        </text>
        <text fg={theme.text.disabled}> · </text>
        {hasModel ? (
          <>
            <text fg={theme.text.primary}>{modelName}</text>
            {providerName && <text fg={theme.text.muted}> {providerName}</text>}
          </>
        ) : (
          <text fg={theme.warning}>No model selected</text>
        )}
        <text fg={theme.text.disabled}> · </text>
        <text fg={theme.warning} onMouseDown={onCycleEffort}>
          {effortLevel}
        </text>
        <text fg={theme.text.disabled}>
          {" "}
          | {streaming ? "Processing..." : "Ready"}
        </text>
      </box>
    </box>
  );
}

import { Spinner } from "@/components/ui/spinner";
import { AGENT_LABELS, type AgentId } from "@/store/index";
import { RGBA } from "@opentui/core";
import { theme } from "@scode/theme";

const AGENT_COLORS: Record<string, string> = {
  plan: theme.warning,
  write: theme.success,
  chat: theme.brand.primary,
};

interface ComposerFooterProps {
  isCommand: boolean;
  currentAgent: AgentId;
  effortLevel: string;
  onCycleEffort: () => void;
  supportedEfforts: string[];
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
  supportedEfforts,
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
        {supportedEfforts.length > 0 && (
          <>
            <text fg={theme.text.disabled}> · </text>
            <text fg={theme.warning} onMouseDown={onCycleEffort}>
              {effortLevel}
            </text>
          </>
        )}
        <text fg={theme.text.disabled}> | </text>
        {streaming ? (
          <box flexDirection="row">
            <Spinner fg={RGBA.fromHex(theme.warning)} />
            <text fg={RGBA.fromHex(theme.warning)}> Processing...</text>
          </box>
        ) : (
          <text fg={theme.text.disabled}>Ready</text>
        )}
      </box>
    </box>
  );
}

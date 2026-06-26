import { useHealth, useModels } from "../hooks/useApi";
import { useAppStore } from "../store/index";
import { EFFORT_LEVELS, type EffortLevel } from "../store/index";

import { formatModelName, parseModelString } from "@scode/shared/utils";
import { theme } from "@scode/theme";

interface HeaderProps {
  modelDisplay?: string;
  sessionName?: string;
}

function cycleEffort(level: EffortLevel): EffortLevel {
  const idx = EFFORT_LEVELS.indexOf(level);
  return EFFORT_LEVELS[(idx + 1) % EFFORT_LEVELS.length];
}

export function Header({ modelDisplay, sessionName }: HeaderProps) {
  const serverUrl = useAppStore((s) => s.serverUrl);
  const model = useAppStore((s) => s.model);
  const effortLevel = useAppStore((s) => s.effortLevel);
  const setEffortLevel = useAppStore((s) => s.setEffortLevel);
  const currentAgent = useAppStore((s) => s.currentAgent);
  const sidebarVisible = useAppStore((s) => s.sidebarVisible);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const { data: health } = useHealth(serverUrl);
  const { data: modelsData } = useModels(serverUrl);
  const connected = health?.healthy;

  const modelStr = model ?? modelDisplay;
  const parsed = modelStr ? parseModelString(modelStr) : null;
  const models = modelsData?.models ?? [];

  const providerName = parsed
    ? (models.find((m) => m.provider === parsed.providerId)?.providerName ??
      parsed.providerId)
    : "";
  const modelName = parsed ? formatModelName(parsed.model) : "";
  const hasModel = !!modelName;

  const agentLabel =
    currentAgent === "chat"
      ? "Chat"
      : currentAgent === "plan"
        ? "Plan"
        : "Write";

  return (
    <box
      height={1}
      backgroundColor={theme.background.secondary}
      paddingLeft={1}
      paddingRight={1}
    >
      <box flexDirection="row" width="100%" justifyContent="space-between">
        <box flexDirection="row">
          <box onMouseDown={toggleSidebar}>
            <text fg={theme.text.disabled}>☰</text>
          </box>
          <text fg={theme.brand.primary} paddingLeft={1}>
            <strong>{agentLabel}</strong>
          </text>
          {sessionName && (
            <text fg={theme.text.muted} paddingLeft={1}>
              · {sessionName.slice(0, 24)}
            </text>
          )}
        </box>
        <box flexDirection="row">
          <text fg={connected ? theme.success : theme.danger}>
            {connected ? "●" : "○"}
          </text>
          {hasModel ? (
            <text paddingLeft={1}>
              <text fg={theme.text.primary}>
                <strong>{modelName}</strong>
              </text>
              {providerName && (
                <text fg={theme.text.muted}> {providerName}</text>
              )}
            </text>
          ) : (
            <text fg={theme.warning} paddingLeft={1}>
              No model selected
            </text>
          )}
          <text
            fg={theme.warning}
            paddingLeft={1}
            onMouseDown={() => setEffortLevel(cycleEffort(effortLevel))}
          >
            {effortLevel}
          </text>
        </box>
      </box>
    </box>
  );
}

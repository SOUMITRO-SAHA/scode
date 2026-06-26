import { useHealth, useModels } from "../hooks/useApi";
import { useAppStore } from "../store/index";
import { EFFORT_LEVELS, type EffortLevel } from "../store/index";

import { theme } from "@scode/theme";

interface HeaderProps {
  modelDisplay?: string;
  sessionName?: string;
}

function parseModelString(
  modelStr: string,
): { providerId: string; modelId: string } | null {
  const idx = modelStr.indexOf("/");
  if (idx === -1) return null;
  return {
    providerId: modelStr.slice(0, idx),
    modelId: modelStr.slice(idx + 1),
  };
}

function formatModelName(modelId: string): string {
  return modelId
    .replace(/^claude-/, "")
    .replace(/-\d{8}$/, "")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
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

  const modelStr = model ?? modelDisplay ?? "";
  const parsed = parseModelString(modelStr);
  const models = modelsData?.models ?? [];

  const providerName = parsed
    ? (models.find((m) => m.provider === parsed.providerId)?.providerName ??
      parsed.providerId)
    : "";
  const modelName = parsed ? formatModelName(parsed.modelId) : modelStr;

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
          {modelName && (
            <text paddingLeft={1}>
              <text fg={theme.text.primary}>
                <strong>{modelName}</strong>
              </text>
              {providerName && (
                <text fg={theme.text.muted}> {providerName}</text>
              )}
            </text>
          )}
          {!modelName && (
            <text fg={theme.text.muted} paddingLeft={1}>
              No Model
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

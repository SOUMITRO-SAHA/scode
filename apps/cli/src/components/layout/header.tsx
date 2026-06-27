import { useConnectionStatus } from "@/hooks/useApi";
import { useAppStore } from "@/store/index";
import { EFFORT_LEVELS, type EffortLevel } from "@/store/index";
import { theme } from "@scode/theme";

interface HeaderProps {
  sessionName?: string;
}

function cycleEffort(level: EffortLevel): EffortLevel {
  const idx = EFFORT_LEVELS.indexOf(level);
  return EFFORT_LEVELS[(idx + 1) % EFFORT_LEVELS.length];
}

export function Header({ sessionName }: HeaderProps) {
  const serverUrl = useAppStore((s) => s.serverUrl);
  const effortLevel = useAppStore((s) => s.effortLevel);
  const setEffortLevel = useAppStore((s) => s.setEffortLevel);
  const currentAgent = useAppStore((s) => s.currentAgent);
  const sidebarVisible = useAppStore((s) => s.sidebarVisible);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const { status } = useConnectionStatus(serverUrl);

  const agentLabel = sessionName
    ? sessionName.slice(0, 24)
    : currentAgent === "chat"
      ? "Chat"
      : currentAgent === "plan"
        ? "Plan"
        : "Write";

  return (
    <box
      height={1}
      marginBottom={0.5}
      backgroundColor={theme.background.secondary}
      paddingLeft={1}
      paddingRight={1}
      alignItems="center"
    >
      <box flexDirection="row" width="100%" justifyContent="space-between">
        <box flexDirection="row" alignItems="center" gap={0.5}>
          {!sidebarVisible && (
            <box onMouseDown={toggleSidebar}>
              <text fg={theme.text.disabled}>☰</text>
            </box>
          )}

          <text fg={theme.text.muted} paddingLeft={1}>
            {agentLabel}
          </text>
        </box>

        <box flexDirection="row" alignItems="center" gap={1}>
          <text
            fg={
              status === "initializing"
                ? theme.warning
                : status === "connected"
                  ? theme.success
                  : theme.danger
            }
          >
            {status === "initializing"
              ? "◌"
              : status === "connected"
                ? "●"
                : "○"}
          </text>

          <text
            fg={theme.warning}
            onMouseDown={() => setEffortLevel(cycleEffort(effortLevel))}
          >
            {effortLevel}
          </text>
        </box>
      </box>
    </box>
  );
}

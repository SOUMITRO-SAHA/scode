import type { ConnectionStatus } from "@/hooks/useApi";
import { theme } from "@scode/theme";

interface ConnectionStatusIndicatorProps {
  status: ConnectionStatus;
  showLabel?: boolean;
}

export function ConnectionStatusIndicator({
  status,
  showLabel = false,
}: ConnectionStatusIndicatorProps) {
  const color =
    status === "initializing"
      ? theme.warning
      : status === "connected"
        ? theme.success
        : theme.danger;

  const icon =
    status === "initializing" ? "◌" : status === "connected" ? "●" : "○";

  const label =
    status === "initializing"
      ? "Initializing..."
      : status === "connected"
        ? "Server Connected"
        : "Connection Failed";

  return (
    <text fg={color}>
      {icon}
      {showLabel ? ` ${label}` : ""}
    </text>
  );
}

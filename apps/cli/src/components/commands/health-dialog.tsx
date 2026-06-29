import { useCallback, useEffect, useState } from "react";

import * as Effect from "effect/Effect";

import { Dialog } from "@/components/ui/dialog";
import type { ApiClient } from "@/services/api";
import type { HealthStatus } from "@scode/shared/types";
import { theme } from "@scode/theme";

interface HealthDialogProps {
  api: ApiClient;
  onClose: () => void;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(" ");
}

export function HealthDialog({ api, onClose }: HealthDialogProps) {
  const [data, setData] = useState<HealthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Effect.runPromise(api.health()).then(
      (result) => {
        setData(result);
        setLoading(false);
      },
      (err) => {
        setError((err as Error).message);
        setLoading(false);
      },
    );
  }, [api]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <Dialog title="Server Health" open onClose={handleClose}>
      <box
        flexDirection="column"
        paddingLeft={2}
        paddingRight={2}
        paddingBottom={1}
      >
        {loading ? (
          <text fg={theme.text.muted}>Loading...</text>
        ) : error ? (
          <text fg={theme.danger}>Error: {error}</text>
        ) : data ? (
          <>
            <StatRow
              label="Status"
              value={data.healthy ? "OK" : "Unhealthy"}
              valueColor={data.healthy ? theme.success : theme.danger}
            />
            <StatRow label="Uptime" value={formatUptime(data.uptime)} />
            <StatRow
              label="Registered Providers"
              value={String(data.providers)}
            />
            <StatRow
              label="Connected Providers"
              value={String(data.connectedProviders)}
            />
            <StatRow
              label="Active Clients"
              value={String(data.activeClients)}
            />
            <StatRow label="Sessions" value={String(data.sessions)} />
            <StatRow
              label="Default Provider"
              value={data.defaultProvider || "None"}
            />
            <StatRow
              label="Default Model"
              value={data.defaultModel || "No model selected"}
            />
            {data.connectedProviders === 0 && (
              <box height={1} paddingTop={1}>
                <text fg={theme.warning}>
                  No providers connected — run /connect to add one
                </text>
              </box>
            )}
          </>
        ) : null}
      </box>
    </Dialog>
  );
}

function StatRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <box height={1} flexDirection="row">
      <text fg={theme.text.muted} wrapMode="none" flexShrink={0}>
        {label.padEnd(18)}
      </text>
      <text fg={valueColor ?? theme.text.primary} wrapMode="none">
        {value}
      </text>
    </box>
  );
}

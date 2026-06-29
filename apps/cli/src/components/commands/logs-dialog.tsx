import { useCallback, useEffect, useState } from "react";

import * as Effect from "effect/Effect";

import { Dialog } from "@/components/ui/dialog";
import type { ApiClient } from "@/services/api";
import { TextAttributes } from "@opentui/core";
import { theme } from "@scode/theme";

export function LogsDialog({
  api,
  onClose,
}: {
  api: ApiClient;
  onClose?: () => void;
}) {
  const [logEntries, setLogEntries] = useState<
    { file: string; size: number; content: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Effect.runPromise(api.getLogs())
      .then((result) => {
        setLogEntries(result.logs);
        setLoading(false);
      })
      .catch((err) => {
        setError((err as Error).message);
        setLoading(false);
      });
  }, [api]);

  const handleClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  return (
    <Dialog title="Server Logs" open onClose={handleClose}>
      {loading && (
        <box paddingLeft={4} paddingTop={1}>
          <text fg={theme.text.muted}>Loading logs...</text>
        </box>
      )}
      {error && (
        <box paddingLeft={4} paddingTop={1}>
          <text fg={theme.danger}>{error}</text>
        </box>
      )}
      {!loading && !error && logEntries.length === 0 && (
        <box paddingLeft={4} paddingTop={1}>
          <text fg={theme.text.muted}>No logs found</text>
        </box>
      )}
      {logEntries.map((entry, i) => (
        <box key={i} flexDirection="column">
          {i > 0 && <box height={1} />}
          <box
            flexDirection="row"
            justifyContent="center"
            width="100%"
            paddingBottom={1}
          >
            <text fg={theme.brand.primary}>
              {`=== ${entry.file} (${entry.size} bytes) ===`}
            </text>
          </box>
          {entry.content.split("\n").map((line, j) => (
            <box key={j} flexDirection="row" width="100%" paddingBottom={0.5}>
              <text width={1}> </text>
              <text
                fg={theme.text.secondary}
                flexGrow={1}
                flexShrink={1}
                wrapMode="word"
                width="100%"
              >
                {line || " "}
              </text>
            </box>
          ))}
        </box>
      ))}
    </Dialog>
  );
}

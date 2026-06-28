import { useCallback, useState } from "react";

import * as Effect from "effect/Effect";

import { DialogPrompt } from "@/components/ui/dialog-prompt";
import type { ApiClient } from "@/services/api";
import type { KeyEvent } from "@opentui/core";
import { useKeyboard, useTerminalDimensions } from "@opentui/react";
import { theme } from "@scode/theme";

interface SessionRenameProps {
  name?: string;
  sessionId: string;
  api: ApiClient;
  onClose: () => void;
  onRefresh: () => void;
}

export function SessionRename({
  name,
  sessionId,
  api,
  onClose,
  onRefresh,
}: SessionRenameProps) {
  const { width: termWidth, height: termHeight } = useTerminalDimensions();
  const [open, setOpen] = useState(true);
  const [busy, setBusy] = useState(false);

  const handleClose = useCallback(() => {
    setOpen(false);
    onClose();
  }, [onClose]);

  useKeyboard((event: KeyEvent) => {
    if (!open) return;
    if (event.name === "escape") {
      handleClose();
    }
  });

  const handleConfirm = useCallback(
    (value: string) => {
      if (!value.trim() || busy) return;
      setBusy(true);
      Effect.runPromise(api.renameSession(sessionId, value.trim()))
        .then(() => {
          onRefresh();
          handleClose();
        })
        .catch(() => {
          setBusy(false);
        });
    },
    [busy, sessionId, api, onRefresh, handleClose],
  );

  if (!open) return null;

  const paletteWidth = Math.min(Math.floor(termWidth * 0.6), 64);

  return (
    <box
      position="absolute"
      left={0}
      top={0}
      width={termWidth}
      height={termHeight}
      alignItems="center"
      paddingTop={Math.floor(termHeight / 4)}
      zIndex={3000}
      flexDirection="column"
    >
      <box
        width={paletteWidth}
        maxWidth={termWidth - 2}
        backgroundColor={theme.background.surface}
        borderStyle="rounded"
        borderColor={theme.border.focus}
        paddingTop={1}
        flexDirection="column"
      >
        <DialogPrompt
          title="Rename Session"
          value={name}
          placeholder="Enter session name"
          busy={busy}
          busyText="Renaming..."
          onConfirm={handleConfirm}
          onCancel={handleClose}
        />
      </box>
    </box>
  );
}

import { useCallback, useMemo, useState } from "react";

import { DialogSelect, type DialogSelectOption } from "@/components/ui/dialog";
import type { KeyEvent } from "@opentui/core";
import { useKeyboard, useTerminalDimensions } from "@opentui/react";
import { theme } from "@scode/theme";

interface SessionDeleteConfirmProps {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function SessionDeleteConfirm({
  name,
  onConfirm,
  onCancel,
}: SessionDeleteConfirmProps) {
  const { width: termWidth, height: termHeight } = useTerminalDimensions();
  const [open, setOpen] = useState(true);

  const handleClose = useCallback(() => {
    setOpen(false);
    onCancel();
  }, [onCancel]);

  useKeyboard((event: KeyEvent) => {
    if (!open) return;
    if (event.name === "escape") {
      handleClose();
    }
  });

  const trimmedName = name.length > 24 ? `${name.slice(0, 24)}...` : name;

  const options = useMemo<DialogSelectOption<string>[]>(() => {
    return [
      {
        title: "Cancel",
        description: "keep session",
        value: "cancel",
        truncateTitle: false,
      },
      {
        title: "Delete",
        description: "remove permanently",
        value: "delete",
        truncateTitle: false,
      },
    ];
  }, []);

  const handleSelect = useCallback(
    (option: DialogSelectOption<string>) => {
      if (option.value === "delete") {
        setOpen(false);
        onConfirm();
      } else {
        handleClose();
      }
    },
    [onConfirm, handleClose],
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
        <DialogSelect
          title={`Delete "${trimmedName}"?`}
          placeholder="Choose an action..."
          options={options}
          flat
          current={"cancel"}
          onSelect={handleSelect}
          onClose={handleClose}
          footer={<text fg={theme.text.disabled}>↑↓ navigate</text>}
          footerHints={[{ title: "↵", label: "confirm", side: "right" }]}
        />
      </box>
    </box>
  );
}

import { useDialog } from "./dialog";

import { TextAttributes } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { theme } from "@scode/theme";

export function DialogHelp() {
  const dialog = useDialog();

  useKeyboard((event: { name: string }) => {
    if (event.name === "return" || event.name === "escape") {
      dialog.clear();
    }
  });

  return (
    <box paddingLeft={2} paddingRight={2} gap={1}>
      <box flexDirection="row" justifyContent="space-between">
        <text attributes={TextAttributes.BOLD} fg={theme.text.primary}>
          Help
        </text>
        <text fg={theme.text.muted} onMouseUp={() => dialog.clear()}>
          esc/enter
        </text>
      </box>
      <box paddingBottom={1}>
        <text fg={theme.text.muted}>
          Press Ctrl+P to see all available actions and commands in any context.
        </text>
      </box>
      <box flexDirection="row" justifyContent="flex-end" paddingBottom={1}>
        <box
          paddingLeft={3}
          paddingRight={3}
          backgroundColor={theme.brand.primary}
          onMouseUp={() => dialog.clear()}
        >
          <text fg={theme.text.inverse}>ok</text>
        </box>
      </box>
    </box>
  );
}

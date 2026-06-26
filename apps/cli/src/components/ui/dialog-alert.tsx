import { type DialogContextValue, useDialog } from "./dialog.js";

import { TextAttributes } from "@opentui/core";
import { theme } from "@scode/theme";

export type DialogAlertProps = {
  title: string;
  message: string;
  onConfirm?: () => void;
};

export function DialogAlert(props: DialogAlertProps) {
  const dialog = useDialog();

  return (
    <box paddingLeft={2} paddingRight={2} gap={1}>
      <box flexDirection="row" justifyContent="space-between">
        <text attributes={TextAttributes.BOLD} fg={theme.text.primary}>
          {props.title}
        </text>
        <text fg={theme.text.muted} onMouseUp={() => dialog.clear()}>
          esc
        </text>
      </box>
      <box paddingBottom={1}>
        <text fg={theme.text.muted}>{props.message}</text>
      </box>
      <box flexDirection="row" justifyContent="flex-end" paddingBottom={1}>
        <box
          paddingLeft={3}
          paddingRight={3}
          backgroundColor={theme.brand.primary}
          onMouseUp={() => {
            props.onConfirm?.();
            dialog.clear();
          }}
        >
          <text fg={theme.text.inverse}>ok</text>
        </box>
      </box>
    </box>
  );
}

DialogAlert.show = (
  dialog: DialogContextValue,
  title: string,
  message: string,
) => {
  return new Promise<void>((resolve) => {
    dialog.replace(
      <DialogAlert
        title={title}
        message={message}
        onConfirm={() => resolve()}
      />,
      () => resolve(),
    );
  });
};

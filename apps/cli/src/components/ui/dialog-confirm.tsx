import { useCallback, useState } from "react";

import { type DialogContextValue, useDialog } from "./dialog";

import { TextAttributes } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { theme } from "@scode/theme";

export type DialogConfirmProps = {
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  label?: string;
};

export type DialogConfirmResult = boolean | undefined;

function titlecase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function DialogConfirm(props: DialogConfirmProps) {
  const dialog = useDialog();
  const [active, setActive] = useState<"confirm" | "cancel">("confirm");

  const handleConfirm = useCallback(() => {
    if (active === "confirm") props.onConfirm?.();
    if (active === "cancel") props.onCancel?.();
    dialog.clear();
  }, [active, props, dialog]);

  const handleLeft = useCallback(() => {
    setActive((prev) => (prev === "confirm" ? "cancel" : "confirm"));
  }, []);

  const handleRight = useCallback(() => {
    setActive((prev) => (prev === "confirm" ? "cancel" : "confirm"));
  }, []);

  useKeyboard((event: { name: string }) => {
    if (event.name === "return") handleConfirm();
    if (event.name === "left") handleLeft();
    if (event.name === "right") handleRight();
  });

  const buttons = ["cancel", "confirm"] as const;

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
        {buttons.map((key) => (
          <box
            key={key}
            paddingLeft={1}
            paddingRight={1}
            backgroundColor={key === active ? theme.brand.primary : undefined}
            onMouseUp={() => {
              if (key === "confirm") props.onConfirm?.();
              if (key === "cancel") props.onCancel?.();
              dialog.clear();
            }}
          >
            <text fg={key === active ? theme.text.inverse : theme.text.muted}>
              {titlecase(key === "cancel" ? (props.label ?? key) : key)}
            </text>
          </box>
        ))}
      </box>
    </box>
  );
}

DialogConfirm.show = (
  dialog: DialogContextValue,
  title: string,
  message: string,
  label?: string,
) => {
  return new Promise<DialogConfirmResult>((resolve) => {
    dialog.replace(
      <DialogConfirm
        title={title}
        message={message}
        onConfirm={() => resolve(true)}
        onCancel={() => resolve(false)}
        label={label}
      />,
      () => resolve(undefined),
    );
  });
};

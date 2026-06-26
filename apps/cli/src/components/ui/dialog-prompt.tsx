import { useCallback, useEffect, useRef } from "react";

import { type DialogContextValue, useDialog } from "./dialog.js";

import { TextAttributes, TextareaRenderable } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { theme } from "@scode/theme";

export type DialogPromptProps = {
  title: string;
  description?: React.ReactNode;
  placeholder?: string;
  value?: string;
  busy?: boolean;
  busyText?: string;
  onConfirm?: (value: string) => void;
  onCancel?: () => void;
};

export function DialogPrompt(props: DialogPromptProps) {
  const dialog = useDialog();
  const textareaRef = useRef<TextareaRenderable | null>(null);

  const confirm = useCallback(() => {
    if (props.busy) return;
    const textarea = textareaRef.current;
    if (!textarea || textarea.isDestroyed) return;
    props.onConfirm?.(textarea.plainText);
  }, [props]);

  useKeyboard((event: { name: string }) => {
    if (event.name === "return") confirm();
  });

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || textarea.isDestroyed) return;
    if (props.busy) {
      textarea.blur();
      return;
    }
    textarea.focus();
    textarea.gotoLineEnd();
  }, [props.busy]);

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
      <box gap={1}>
        {props.description}
        <textarea
          height={3}
          ref={(val: TextareaRenderable) => {
            textareaRef.current = val;
          }}
          initialValue={props.value}
          placeholder={props.placeholder ?? "Enter text"}
          placeholderColor={theme.text.muted}
          textColor={props.busy ? theme.text.muted : theme.text.primary}
          focusedTextColor={props.busy ? theme.text.muted : theme.text.primary}
          cursorColor={
            props.busy ? theme.background.primary : theme.text.primary
          }
        />
        {props.busy && (
          <text fg={theme.text.muted}>{props.busyText ?? "Working..."}</text>
        )}
      </box>
      <box paddingBottom={1} gap={1} flexDirection="row">
        {!props.busy && <text fg={theme.text.muted}>return submit</text>}
        {props.busy && <text fg={theme.text.muted}>processing...</text>}
      </box>
    </box>
  );
}

DialogPrompt.show = (
  dialog: DialogContextValue,
  title: string,
  options?: Omit<DialogPromptProps, "title">,
) => {
  return new Promise<string | null>((resolve) => {
    dialog.replace(
      <DialogPrompt
        title={title}
        {...options}
        onConfirm={(value) => resolve(value)}
        onCancel={() => resolve(null)}
      />,
      () => resolve(null),
    );
  });
};

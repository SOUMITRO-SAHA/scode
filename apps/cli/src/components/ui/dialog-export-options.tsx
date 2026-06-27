import { useCallback, useEffect, useRef, useState } from "react";

import { type DialogContextValue, useDialog } from "./dialog";

import { TextAttributes, TextareaRenderable } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { theme } from "@scode/theme";

export type DialogExportOptionsProps = {
  defaultFilename: string;
  defaultThinking: boolean;
  defaultToolDetails: boolean;
  defaultAssistantMetadata: boolean;
  defaultOpenWithoutSaving: boolean;
  onConfirm?: (options: {
    filename: string;
    thinking: boolean;
    toolDetails: boolean;
    assistantMetadata: boolean;
    openWithoutSaving: boolean;
  }) => void;
  onCancel?: () => void;
};

type ActiveField =
  | "filename"
  | "thinking"
  | "toolDetails"
  | "assistantMetadata"
  | "openWithoutSaving";

export function DialogExportOptions(props: DialogExportOptionsProps) {
  const dialog = useDialog();
  const textareaRef = useRef<TextareaRenderable | null>(null);
  const [active, setActive] = useState<ActiveField>("filename");
  const [thinking, setThinking] = useState(props.defaultThinking);
  const [toolDetails, setToolDetails] = useState(props.defaultToolDetails);
  const [assistantMetadata, setAssistantMetadata] = useState(
    props.defaultAssistantMetadata,
  );
  const [openWithoutSaving, setOpenWithoutSaving] = useState(
    props.defaultOpenWithoutSaving,
  );

  const order: ActiveField[] = [
    "filename",
    "thinking",
    "toolDetails",
    "assistantMetadata",
    "openWithoutSaving",
  ];

  const toggleField = useCallback(() => {
    if (active === "thinking") setThinking((prev) => !prev);
    if (active === "toolDetails") setToolDetails((prev) => !prev);
    if (active === "assistantMetadata") setAssistantMetadata((prev) => !prev);
    if (active === "openWithoutSaving") setOpenWithoutSaving((prev) => !prev);
  }, [active]);

  useKeyboard((event: { name: string }) => {
    if (event.name === "tab") {
      const currentIndex = order.indexOf(active);
      const nextIndex = (currentIndex + 1) % order.length;
      setActive(order[nextIndex]);
      return true;
    }
    if (event.name === "space" && active !== "filename") {
      toggleField();
      return true;
    }
    if (event.name === "return") {
      if (active === "filename") {
        const filename =
          textareaRef.current?.plainText ?? props.defaultFilename;
        props.onConfirm?.({
          filename,
          thinking,
          toolDetails,
          assistantMetadata,
          openWithoutSaving,
        });
      } else {
        const filename =
          textareaRef.current?.plainText ?? props.defaultFilename;
        props.onConfirm?.({
          filename,
          thinking,
          toolDetails,
          assistantMetadata,
          openWithoutSaving,
        });
      }
      return true;
    }
    if (event.name === "escape") {
      dialog.clear();
      props.onCancel?.();
      return true;
    }
    return false;
  });

  useEffect(() => {
    dialog.setSize("medium");
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.gotoLineEnd();
    }, 1);
  }, []);

  return (
    <box paddingLeft={2} paddingRight={2} gap={1}>
      <box flexDirection="row" justifyContent="space-between">
        <text attributes={TextAttributes.BOLD} fg={theme.text.primary}>
          Export Options
        </text>
        <text
          fg={theme.text.muted}
          onMouseUp={() => {
            dialog.clear();
            props.onCancel?.();
          }}
        >
          esc
        </text>
      </box>
      <box gap={1}>
        <box>
          <text fg={theme.text.primary}>Filename:</text>
        </box>
        <textarea
          onSubmit={() => {
            const filename =
              textareaRef.current?.plainText ?? props.defaultFilename;
            props.onConfirm?.({
              filename,
              thinking,
              toolDetails,
              assistantMetadata,
              openWithoutSaving,
            });
          }}
          height={3}
          ref={(val: TextareaRenderable | null) => {
            textareaRef.current = val;
            if (val) val.traits = { status: "FILENAME" };
          }}
          initialValue={props.defaultFilename}
          placeholder="Enter filename"
          placeholderColor={theme.text.muted}
          textColor={theme.text.primary}
          focusedTextColor={theme.text.primary}
          cursorColor={theme.text.primary}
        />
      </box>
      <box flexDirection="column">
        <box
          flexDirection="row"
          gap={2}
          paddingLeft={1}
          backgroundColor={
            active === "thinking" ? theme.background.strong : undefined
          }
          onMouseUp={() => setActive("thinking")}
        >
          <text
            fg={active === "thinking" ? theme.brand.primary : theme.text.muted}
          >
            {thinking ? "[x]" : "[ ]"}
          </text>
          <text
            fg={
              active === "thinking" ? theme.brand.primary : theme.text.primary
            }
          >
            Include thinking
          </text>
        </box>
        <box
          flexDirection="row"
          gap={2}
          paddingLeft={1}
          backgroundColor={
            active === "toolDetails" ? theme.background.strong : undefined
          }
          onMouseUp={() => setActive("toolDetails")}
        >
          <text
            fg={
              active === "toolDetails" ? theme.brand.primary : theme.text.muted
            }
          >
            {toolDetails ? "[x]" : "[ ]"}
          </text>
          <text
            fg={
              active === "toolDetails"
                ? theme.brand.primary
                : theme.text.primary
            }
          >
            Include tool details
          </text>
        </box>
        <box
          flexDirection="row"
          gap={2}
          paddingLeft={1}
          backgroundColor={
            active === "assistantMetadata" ? theme.background.strong : undefined
          }
          onMouseUp={() => setActive("assistantMetadata")}
        >
          <text
            fg={
              active === "assistantMetadata"
                ? theme.brand.primary
                : theme.text.muted
            }
          >
            {assistantMetadata ? "[x]" : "[ ]"}
          </text>
          <text
            fg={
              active === "assistantMetadata"
                ? theme.brand.primary
                : theme.text.primary
            }
          >
            Include assistant metadata
          </text>
        </box>
        <box
          flexDirection="row"
          gap={2}
          paddingLeft={1}
          backgroundColor={
            active === "openWithoutSaving" ? theme.background.strong : undefined
          }
          onMouseUp={() => setActive("openWithoutSaving")}
        >
          <text
            fg={
              active === "openWithoutSaving"
                ? theme.brand.primary
                : theme.text.muted
            }
          >
            {openWithoutSaving ? "[x]" : "[ ]"}
          </text>
          <text
            fg={
              active === "openWithoutSaving"
                ? theme.brand.primary
                : theme.text.primary
            }
          >
            Open without saving
          </text>
        </box>
      </box>
      {active !== "filename" && (
        <text fg={theme.text.muted} paddingBottom={1}>
          Press <text fg={theme.text.primary}>space</text> to toggle,{" "}
          <text fg={theme.text.primary}>return</text> to confirm
        </text>
      )}
      {active === "filename" && (
        <text fg={theme.text.muted} paddingBottom={1}>
          Press <text fg={theme.text.primary}>return</text> to confirm,{" "}
          <text fg={theme.text.primary}>tab</text> for options
        </text>
      )}
    </box>
  );
}

DialogExportOptions.show = (
  dialog: DialogContextValue,
  defaultFilename: string,
  defaultThinking: boolean,
  defaultToolDetails: boolean,
  defaultAssistantMetadata: boolean,
  defaultOpenWithoutSaving: boolean,
) => {
  return new Promise<{
    filename: string;
    thinking: boolean;
    toolDetails: boolean;
    assistantMetadata: boolean;
    openWithoutSaving: boolean;
  } | null>((resolve) => {
    dialog.replace(
      <DialogExportOptions
        defaultFilename={defaultFilename}
        defaultThinking={defaultThinking}
        defaultToolDetails={defaultToolDetails}
        defaultAssistantMetadata={defaultAssistantMetadata}
        defaultOpenWithoutSaving={defaultOpenWithoutSaving}
        onConfirm={(options) => resolve(options)}
        onCancel={() => resolve(null)}
      />,
      () => resolve(null),
    );
  });
};

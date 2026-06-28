import { useEffect, useRef } from "react";

import type { ToastInput } from "@/components/ui/toast";
import { readClipboard, writeClipboard } from "@/utils/clipboard";
import type { KeyEvent, TextareaRenderable } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { DebugLogger } from "@scode/shared/logger";

const dbg = new DebugLogger("kb:shortcuts");

interface KeyboardShortcutsOptions {
  paletteVisible: boolean;
  modelPickerOpen: boolean;
  providerPickerOpen: boolean;
  sidebarVisible: boolean;
  setPaletteVisible: (visible: boolean | ((v: boolean) => boolean)) => void;
  setModelPickerOpen: (open: boolean | ((v: boolean) => boolean)) => void;
  setProviderPickerOpen: (open: boolean | ((v: boolean) => boolean)) => void;
  toggleSidebar: () => void;
  clearMessages: () => void;
  toggleDebug: () => void;
  onExit?: () => void;
  bumpFocus: () => void;
  textareaRef?: React.RefObject<TextareaRenderable | null>;
  showToast?: (options: ToastInput) => void;
}

export function useKeyboardShortcuts({
  paletteVisible,
  modelPickerOpen,
  providerPickerOpen,
  sidebarVisible,
  setPaletteVisible,
  setModelPickerOpen,
  setProviderPickerOpen,
  toggleSidebar,
  clearMessages,
  toggleDebug,
  onExit,
  bumpFocus,
  textareaRef,
  showToast,
}: KeyboardShortcutsOptions) {
  const onExitRef = useRef(onExit);
  onExitRef.current = onExit;

  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;

  const handleCopyRef = useRef<(() => void) | null>(null);
  const handlePasteRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    dbg.log("textareaRef changed", {
      hasRef: !!textareaRef,
      refCurrent: !!textareaRef?.current,
      isDestroyed: textareaRef?.current?.isDestroyed,
    });

    handleCopyRef.current = textareaRef
      ? () => {
          const ta = textareaRef.current;
          dbg.log("copy triggered", {
            taExists: !!ta,
            isDestroyed: ta?.isDestroyed,
            hasSelection: ta?.hasSelection?.(),
          });
          if (!ta || !ta.hasSelection()) return;
          const selectedText = ta.getSelectedText();
          dbg.log("selected text", {
            length: selectedText?.length,
            text: selectedText,
          });
          if (selectedText) {
            writeClipboard(selectedText);
            dbg.log("clipboard write done");
            showToastRef.current?.({
              variant: "success",
              message: "Copied ✓",
            });
          }
        }
      : null;

    handlePasteRef.current = textareaRef
      ? () => {
          const ta = textareaRef.current;
          dbg.log("paste triggered", {
            taExists: !!ta,
            isDestroyed: ta?.isDestroyed,
          });
          if (!ta) return;
          const text = readClipboard();
          dbg.log("clipboard read result", {
            textExists: !!text,
            textLength: text?.length,
            text,
          });
          if (text) {
            ta.insertText(text);
            dbg.log("insertText done");
          }
        }
      : null;
  }, [textareaRef]);

  useKeyboard((key: KeyEvent) => {
    dbg.log("key event", {
      name: key.name,
      ctrl: key.ctrl,
      meta: key.meta,
      shift: key.shift,
      option: key.option,
      super: key.super,
      sequence: key.sequence?.length,
      eventType: key.eventType,
    });

    if (key.name === "escape") {
      if (paletteVisible) {
        setPaletteVisible(false);
        bumpFocus();
      } else if (modelPickerOpen) {
        setModelPickerOpen(false);
        bumpFocus();
      } else if (providerPickerOpen) {
        setProviderPickerOpen(false);
        bumpFocus();
      } else if (sidebarVisible) {
        toggleSidebar();
      }
    } else if (key.ctrl && key.name === "p") {
      if (paletteVisible) bumpFocus();
      setPaletteVisible((v) => !v);
    } else if (key.ctrl && key.name === "l") {
      clearMessages();
    } else if (key.ctrl && key.name === "d") {
      toggleDebug();
    } else if (key.ctrl && key.name === "s") {
      toggleSidebar();
    } else if (key.ctrl && key.name === "m") {
      setModelPickerOpen((v) => !v);
    } else if (key.ctrl && key.shift && key.name === "p") {
      setProviderPickerOpen((v) => !v);
    } else if ((key.meta || key.super) && key.name === "c") {
      // Mac: Cmd+C copies selected text (super on Kitty, meta on ANSI)
      handleCopyRef.current?.();
    } else if ((key.meta || key.super) && key.name === "v") {
      // Mac: Cmd+V pastes from clipboard (super on Kitty, meta on ANSI)
      handlePasteRef.current?.();
    } else if (key.ctrl && key.name === "v") {
      // Non-Mac: Ctrl+V pastes from clipboard
      handlePasteRef.current?.();
    } else if (key.ctrl && (key.name === "c" || key.name === "q")) {
      onExitRef.current?.();
    }
  });
}

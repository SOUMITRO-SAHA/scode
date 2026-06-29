import { useRef } from "react";

import type { KeyEvent } from "@opentui/core";
import { useKeyboard } from "@opentui/react";

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
}: KeyboardShortcutsOptions) {
  const onExitRef = useRef(onExit);
  onExitRef.current = onExit;

  useKeyboard((key: KeyEvent) => {
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
    } else if (key.ctrl && (key.name === "c" || key.name === "q")) {
      onExitRef.current?.();
    }
  });
}

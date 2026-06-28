import { useCallback, useEffect, useRef, useState } from "react";

import * as Effect from "effect/Effect";

import type { ApiClient } from "@/services/api";
import { TextAttributes, TextareaRenderable } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
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
  const textareaRef = useRef<TextareaRenderable | null>(null);
  const [busy, setBusy] = useState(false);

  const confirm = useCallback(() => {
    if (busy) return;
    const textarea = textareaRef.current;
    if (!textarea || textarea.isDestroyed) return;
    const value = textarea.plainText.trim();
    if (!value) return;
    setBusy(true);
    Effect.runPromise(api.renameSession(sessionId, value))
      .then(() => {
        onRefresh();
        onClose();
      })
      .catch(() => {
        setBusy(false);
      });
  }, [busy, sessionId, api, onRefresh, onClose]);

  useKeyboard((event: { name: string }) => {
    if (event.name === "return") confirm();
    if (event.name === "escape") onClose();
  });

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || textarea.isDestroyed) return;
    if (busy) {
      textarea.blur();
      return;
    }
    textarea.focus();
    textarea.gotoLineEnd();
  }, [busy]);

  return (
    <box paddingLeft={2} paddingRight={2} gap={1}>
      <box flexDirection="row" justifyContent="space-between">
        <text attributes={TextAttributes.BOLD} fg={theme.text.primary}>
          Rename Session
        </text>
        <text fg={theme.text.muted} onMouseUp={onClose}>
          esc
        </text>
      </box>
      <box gap={1}>
        <textarea
          height={3}
          ref={(val: TextareaRenderable | null) => {
            textareaRef.current = val;
          }}
          initialValue={name}
          placeholder="Enter session name"
          placeholderColor={theme.text.muted}
          textColor={busy ? theme.text.muted : theme.text.primary}
          focusedTextColor={busy ? theme.text.muted : theme.text.primary}
          cursorColor={busy ? theme.background.primary : theme.text.primary}
        />
        {busy && <text fg={theme.text.muted}>Saving...</text>}
      </box>
      <box paddingBottom={1} gap={1} flexDirection="row">
        {!busy && <text fg={theme.text.muted}>return submit</text>}
        {busy && <text fg={theme.text.muted}>processing...</text>}
      </box>
    </box>
  );
}

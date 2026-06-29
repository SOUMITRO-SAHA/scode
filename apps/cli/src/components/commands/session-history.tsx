import { useMemo } from "react";

import { Dialog } from "@/components/ui/dialog";
import { TextAttributes } from "@opentui/core";
import type { Message } from "@scode/shared/types";
import { theme } from "@scode/theme";

function formatPreview(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 3)}...`;
}

export function SessionHistory({
  messages,
  onClose,
}: {
  messages: readonly Message[];
  onClose?: () => void;
}) {
  const groups = useMemo(() => {
    const user: Message[] = [];
    const assistant: Message[] = [];
    const system: Message[] = [];
    for (const m of messages) {
      if (m.role === "user") user.push(m);
      else if (m.role === "assistant") assistant.push(m);
      else system.push(m);
    }
    return { User: user, Assistant: assistant, System: system };
  }, [messages]);

  return (
    <Dialog
      title={`Session Messages (${messages.length})`}
      open
      onClose={onClose}
    >
      {(Object.entries(groups) as [string, Message[]][])
        .filter(([, msgs]) => msgs.length > 0)
        .map(([category, msgs], groupIndex) => (
          <box key={category} flexDirection="column">
            <box
              height={1}
              marginTop={groupIndex > 0 ? 1 : 0}
              flexDirection="row"
            >
              <text width={2}> </text>
              <text fg={theme.brand.active} attributes={TextAttributes.BOLD}>
                {category.toUpperCase()}
              </text>
            </box>
            {msgs.map((m, i) => {
              const text = formatPreview(m.content, 64);
              const roleLabel =
                m.role === "user"
                  ? "You"
                  : m.role === "assistant"
                    ? "scode"
                    : "system";
              const fg =
                m.role === "assistant"
                  ? theme.brand.primary
                  : m.role === "user"
                    ? theme.text.primary
                    : theme.text.muted;
              return (
                <box key={i} height={1} flexDirection="row" width="100%">
                  <text fg={fg} width={1}>
                    {m.role === "user" ? ">" : " "}
                  </text>
                  <text fg={fg} flexShrink={0} width={roleLabel.length + 2}>
                    {`${roleLabel}:`}
                  </text>
                  <text
                    fg={theme.text.secondary}
                    flexGrow={1}
                    flexShrink={1}
                    overflow="hidden"
                    truncate={true}
                  >
                    {text || "(empty)"}
                  </text>
                </box>
              );
            })}
          </box>
        ))}
      {messages.length === 0 && (
        <box paddingLeft={4} paddingRight={4} paddingTop={1}>
          <text fg={theme.text.muted}>No messages in this session</text>
        </box>
      )}
    </Dialog>
  );
}

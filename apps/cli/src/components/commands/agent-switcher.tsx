import { useCallback, useMemo, useState } from "react";

import { DialogSelect, type DialogSelectOption } from "@/components/ui/dialog";
import { AGENTS, AGENT_LABELS, useAppStore } from "@/store/index";
import type { KeyEvent } from "@opentui/core";
import { useKeyboard, useTerminalDimensions } from "@opentui/react";
import { theme } from "@scode/theme";

export function AgentSwitcher({ onClose }: { onClose?: () => void }) {
  const currentAgent = useAppStore((s) => s.currentAgent);
  const setCurrentAgent = useAppStore((s) => s.setCurrentAgent);
  const { width: termWidth, height: termHeight } = useTerminalDimensions();
  const [open, setOpen] = useState(true);

  const handleClose = useCallback(() => {
    setOpen(false);
    onClose?.();
  }, [onClose]);

  useKeyboard((event: KeyEvent) => {
    if (!open) return;
    if (event.name === "escape") {
      handleClose();
    }
  });

  const handleSelect = useCallback(
    (option: DialogSelectOption<string>) => {
      setCurrentAgent(option.value as typeof currentAgent);
      handleClose();
    },
    [setCurrentAgent, handleClose],
  );

  const options = useMemo((): DialogSelectOption<string>[] => {
    return AGENTS.map((agent) => ({
      title: AGENT_LABELS[agent],
      description:
        agent === "plan"
          ? "Plan and reason about tasks"
          : agent === "write"
            ? "Write and implement code"
            : "Chat and answer questions",
      category: agent === currentAgent ? "Current Agent" : "Available Agents",
      value: agent,
      truncateTitle: false,
    }));
  }, [currentAgent]);

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
          title="Switch Agent"
          placeholder="Search agents..."
          options={options}
          flat
          current={currentAgent}
          onSelect={handleSelect}
          onClose={handleClose}
          footer={<text fg={theme.text.disabled}>↑↓ navigate</text>}
          footerHints={[{ title: "↵", label: "select", side: "right" }]}
        />
      </box>
    </box>
  );
}

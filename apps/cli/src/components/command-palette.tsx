import { useMemo } from "react";

import { COMMANDS, type Command } from "../commands/commands";
import { DialogSelect, type DialogSelectOption } from "./ui/dialog";

import { useKeyboard, useTerminalDimensions } from "@opentui/react";
import { theme } from "@scode/theme";

interface CommandPaletteProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (cmd: Command) => void;
}

const SUGGESTED = new Set(["new", "help", "clear", "session"]);

function isSuggested(cmd: Command) {
  return SUGGESTED.has(cmd.name);
}

export function CommandPalette({
  visible,
  onClose,
  onSelect,
}: CommandPaletteProps) {
  const { width: termWidth, height: termHeight } = useTerminalDimensions();

  useKeyboard((event: any) => {
    if (!visible) return;
    if (event.name === "escape") {
      onClose();
    }
  });

  const options = useMemo((): DialogSelectOption<string>[] => {
    const suggested: DialogSelectOption<string>[] = [];
    const regular: DialogSelectOption<string>[] = [];

    for (const cmd of COMMANDS) {
      const option: DialogSelectOption<string> = {
        title: cmd.name,
        description: cmd.description,
        category: cmd.category,
        value: cmd.name,
        footer: cmd.aliases.length > 0 ? `/${cmd.aliases[0]}` : undefined,
        truncateTitle: false,
      };
      if (isSuggested(cmd)) {
        suggested.push(option);
      } else {
        regular.push(option);
      }
    }

    return [
      ...suggested.map((o) => ({
        ...o,
        value: `suggested:${o.value}` as string,
        category: "Suggested",
      })),
      ...regular,
    ];
  }, []);

  const handleSelect = (option: DialogSelectOption<string>) => {
    const name = option.value.replace(/^suggested:/, "");
    const cmd = COMMANDS.find((c) => c.name === name);
    if (cmd) onSelect(cmd);
  };

  if (!visible) return null;

  const paletteWidth = Math.min(Math.floor(termWidth * 0.6), 64);
  const left = Math.floor((termWidth - paletteWidth) / 2);
  const top = Math.floor(termHeight / 4);

  return (
    <box
      position="absolute"
      left={left}
      top={top}
      width={paletteWidth}
      height={Math.floor(termHeight / 2) - 2}
      borderStyle="rounded"
      borderColor={theme.border.focus}
      backgroundColor={theme.background.surface}
      flexDirection="column"
    >
      <DialogSelect
        title="Commands"
        placeholder="Search commands..."
        options={options}
        flat
        onSelect={handleSelect}
        onClose={onClose}
        footer={<text fg={theme.text.disabled}>↑↓ navigate</text>}
        footerHints={[{ title: "↵", label: "select", side: "right" }]}
      />
    </box>
  );
}

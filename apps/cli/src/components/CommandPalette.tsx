import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { COMMANDS, type Command } from "../commands/commands";

import { useKeyboard, useTerminalDimensions } from "@opentui/react";
import { theme } from "@scode/theme";

interface CommandPaletteProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (cmd: Command) => void;
}

export function CommandPalette({
  visible,
  onClose,
  onSelect,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<any>(null);
  const { width: termWidth, height: termHeight } = useTerminalDimensions();

  useEffect(() => {
    if (visible) {
      setQuery("");
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus?.(), 50);
    }
  }, [visible]);

  const filtered = useMemo(() => {
    if (!query.trim()) return COMMANDS;
    const q = query.toLowerCase();
    return COMMANDS.filter(
      (c) =>
        c.name.includes(q) ||
        c.aliases.some((a) => a.includes(q)) ||
        c.category.includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.usage.toLowerCase().includes(q),
    );
  }, [query]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [filtered.length]);

  const handleKey = useCallback(
    (event: any) => {
      if (!visible) return;
      if (event.name === "down" || (event.ctrl && event.name === "n")) {
        setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1));
      } else if (event.name === "up" || (event.ctrl && event.name === "p")) {
        setSelectedIdx((i) => Math.max(i - 1, 0));
      } else if (event.name === "return") {
        if (filtered[selectedIdx]) {
          onSelect(filtered[selectedIdx]);
          onClose();
        }
      } else if (event.name === "escape") {
        onClose();
      }
    },
    [visible, filtered, selectedIdx, onSelect, onClose],
  );

  useKeyboard(handleKey);

  if (!visible) return null;

  const paletteWidth = Math.min(Math.floor(termWidth * 0.6), 64);
  const categories = [...new Set(filtered.map((c) => c.category))];
  const categoryHeight = 1;
  const maxItemsPerCategory = 8;
  const totalItems = Math.min(
    filtered.length + categories.length * categoryHeight,
    20,
  );
  const paletteHeight = Math.min(totalItems + 3, termHeight - 4);

  const left = Math.floor((termWidth - paletteWidth) / 2);
  const top = Math.floor((termHeight - paletteHeight) / 2);

  return (
    <box
      position="absolute"
      left={left}
      top={top}
      width={paletteWidth}
      height={paletteHeight}
      borderStyle="rounded"
      borderColor={theme.border.focus}
      backgroundColor={theme.background.surface}
      flexDirection="column"
    >
      <box height={1} paddingLeft={1} paddingRight={1}>
        <text fg={theme.brand.primary}>{">"} </text>
        <input
          ref={inputRef}
          value={query}
          onChange={(v: string) => setQuery(v)}
          placeholder="Search commands..."
          width={paletteWidth - 4}
          focused
        />
      </box>
      <box height={1} paddingLeft={1} paddingRight={1} />
      <scrollbox flexGrow={1} flexDirection="column">
        {filtered.length === 0 && (
          <box height={2} justifyContent="center" alignItems="center">
            <text fg={theme.text.disabled}>No commands found</text>
          </box>
        )}
        {categories.map((cat) => {
          const catCmds = filtered.filter((c) => c.category === cat);
          if (catCmds.length === 0) return null;
          return (
            <box key={cat} flexDirection="column">
              <box
                height={1}
                paddingLeft={1}
                paddingRight={1}
                backgroundColor={theme.background.secondary}
              >
                <text fg={theme.text.muted}>{cat}</text>
              </box>
              {catCmds.slice(0, maxItemsPerCategory).map((cmd) => {
                const idx = filtered.indexOf(cmd);
                const isSelected = idx === selectedIdx;
                return (
                  <box
                    key={cmd.name}
                    backgroundColor={
                      isSelected ? theme.background.hover : "transparent"
                    }
                    height={1}
                    paddingLeft={1}
                    paddingRight={1}
                  >
                    <text
                      fg={isSelected ? theme.brand.primary : theme.text.muted}
                    >
                      /{cmd.name}
                    </text>
                    <text
                      fg={
                        isSelected ? theme.text.primary : theme.text.secondary
                      }
                    >
                      {`  ${cmd.description}`}
                    </text>
                  </box>
                );
              })}
            </box>
          );
        })}
      </scrollbox>
      <box
        height={1}
        paddingLeft={1}
        paddingRight={1}
        justifyContent="space-between"
      >
        <text fg={theme.text.disabled}>↑↓ navigate</text>
        <text fg={theme.text.disabled}>↵ select</text>
        <text fg={theme.text.disabled}>esc close</text>
      </box>
    </box>
  );
}

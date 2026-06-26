import type { AutocompleteItem } from "./types";

import { TextAttributes } from "@opentui/core";
import { theme } from "@scode/theme";

interface AutocompleteDropdownProps {
  items: AutocompleteItem[];
  categories: string[];
  maxNameLen: number;
  selectedIndex: number;
  width: number;
  height: number;
  onSelect: (item: AutocompleteItem) => void;
}

export function AutocompleteDropdown({
  items,
  categories,
  maxNameLen,
  selectedIndex,
  width,
  height,
  onSelect,
}: AutocompleteDropdownProps) {
  if (items.length === 0) {
    return (
      <box
        position="absolute"
        top={-3}
        left={1}
        width={width}
        height={3}
        borderStyle="rounded"
        borderColor={theme.border.focus}
        backgroundColor={theme.background.surface}
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
      >
        <text fg={theme.text.disabled}>No matching commands</text>
      </box>
    );
  }

  return (
    <box
      position="absolute"
      top={-height - 1}
      left={1}
      width={width}
      height={height}
      borderStyle="rounded"
      borderColor={theme.border.focus}
      backgroundColor={theme.background.surface}
      flexDirection="column"
    >
      <scrollbox flexGrow={1} flexDirection="column">
        {categories.map((cat, catIdx) => {
          const catItems = items.filter((c) => c.category === cat);
          if (catItems.length === 0) return null;
          return (
            <box key={cat} flexDirection="column">
              <box height={1} paddingLeft={1} paddingTop={catIdx > 0 ? 1 : 0}>
                <text fg={theme.brand.primary} attributes={TextAttributes.BOLD}>
                  {cat}
                </text>
              </box>
              {catItems.map((cmd) => {
                const idx = items.indexOf(cmd);
                const isActive = idx === selectedIndex;
                const nameDisplay = `/${cmd.name}`;
                const paddedName = nameDisplay.padEnd(maxNameLen + 1);
                return (
                  <box
                    key={cmd.name}
                    height={1}
                    paddingLeft={1}
                    paddingRight={1}
                    backgroundColor={
                      isActive ? theme.background.hover : "transparent"
                    }
                    onMouseUp={() => onSelect(cmd)}
                  >
                    <text
                      fg={isActive ? theme.text.primary : theme.text.muted}
                      wrapMode="none"
                    >
                      {paddedName}
                    </text>
                    <text
                      fg={isActive ? theme.text.secondary : theme.text.disabled}
                      wrapMode="none"
                    >
                      {cmd.description}
                    </text>
                  </box>
                );
              })}
            </box>
          );
        })}
      </scrollbox>
    </box>
  );
}

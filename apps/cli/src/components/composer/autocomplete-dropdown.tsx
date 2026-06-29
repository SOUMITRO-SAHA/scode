import { useEffect, useMemo, useRef } from "react";

import type { AutocompleteItem } from "./types";

import type { ScrollBoxRenderable } from "@opentui/core";
import { TextAttributes } from "@opentui/core";
import { theme } from "@scode/theme";

interface AutocompleteDropdownProps {
  items: AutocompleteItem[];
  maxNameLen: number;
  selectedIndex: number;
  width: number;
  onSelect: (item: AutocompleteItem) => void;
  onMouseMove?: () => void;
}

const MAX_VISIBLE_ITEMS = 10;

export function AutocompleteDropdown({
  items,
  maxNameLen,
  selectedIndex,
  width,
  onSelect,
  onMouseMove,
}: AutocompleteDropdownProps) {
  const height = useMemo(() => {
    return Math.min(items.length || 1, MAX_VISIBLE_ITEMS);
  }, [items.length]);

  if (items.length === 0) {
    return (
      <box
        position="absolute"
        top={-3}
        left={0}
        width={width}
        height={3}
        borderStyle="rounded"
        borderColor={theme.border.weak}
        backgroundColor={theme.background.surface}
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
      >
        <text fg={theme.text.muted}>No matching items</text>
      </box>
    );
  }

  const scrollRef = useRef<ScrollBoxRenderable | null>(null);

  useEffect(() => {
    setTimeout(() => {
      const scroll = scrollRef.current;
      if (!scroll) return;
      const children = scroll.getChildren();
      const target = children[selectedIndex];
      if (!target) return;
      const y = target.y - scroll.y;
      if (y >= scroll.height) {
        scroll.scrollBy(y - scroll.height + 1);
      } else if (y < 0) {
        scroll.scrollBy(y);
      }
    }, 0);
  }, [selectedIndex]);

  const paddedNameLen = Math.max(maxNameLen + 1, 12);

  return (
    <box
      position="absolute"
      top={-height - 1}
      left={-1}
      width={width}
      height={height}
      borderStyle="rounded"
      borderColor={theme.border.strong}
      backgroundColor={theme.background.surface}
      flexDirection="column"
    >
      <scrollbox
        ref={scrollRef}
        flexGrow={1}
        flexDirection="column"
        scrollbarOptions={{ visible: false }}
      >
        {items.map((cmd, index) => {
          const isActive = index === selectedIndex;
          const nameDisplay = `/${cmd.name}`;
          const paddedName = nameDisplay.padEnd(paddedNameLen);
          const aliasStr =
            cmd.aliases.length > 0
              ? cmd.aliases.map((a) => `/${a}`).join(" ")
              : "";
          return (
            <box
              key={cmd.name}
              height={1}
              paddingLeft={1}
              paddingRight={1}
              flexDirection="row"
              backgroundColor={isActive ? theme.brand.primary : undefined}
              onMouseMove={onMouseMove}
              onMouseUp={() => onSelect(cmd)}
            >
              <text
                fg={isActive ? theme.text.inverse : theme.text.muted}
                attributes={isActive ? TextAttributes.BOLD : undefined}
                wrapMode="none"
                flexShrink={0}
              >
                {paddedName}
              </text>
              {aliasStr ? (
                <text
                  fg={isActive ? theme.text.inverse : theme.text.disabled}
                  wrapMode="none"
                  flexShrink={0}
                >
                  {aliasStr.padEnd(8)}
                </text>
              ) : null}
              <text
                fg={isActive ? theme.text.inverse : theme.text.disabled}
                wrapMode="none"
              >
                {cmd.description}
              </text>
            </box>
          );
        })}
      </scrollbox>
    </box>
  );
}

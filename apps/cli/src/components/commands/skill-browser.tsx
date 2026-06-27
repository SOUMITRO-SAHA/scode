import { useCallback, useMemo, useState } from "react";

import { DialogSelect, type DialogSelectOption } from "@/components/ui/dialog";
import { useSkills } from "@/hooks/useApi";
import { useAppStore } from "@/store/index";
import type { KeyEvent } from "@opentui/core";
import { useKeyboard, useTerminalDimensions } from "@opentui/react";
import { theme } from "@scode/theme";

export function SkillBrowser({
  onSelect,
  onClose,
}: {
  onSelect?: (skillName: string) => void;
  onClose?: () => void;
}) {
  const serverUrl = useAppStore((s) => s.serverUrl);
  const { data, isLoading } = useSkills(serverUrl);
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
      onSelect?.(option.value);
      handleClose();
    },
    [onSelect, handleClose],
  );

  const options = useMemo((): DialogSelectOption<string>[] => {
    if (!data?.skills) return [];
    const maxWidth = Math.max(0, ...data.skills.map((s) => s.name.length));
    return data.skills.map((s) => ({
      title: s.name.padEnd(maxWidth),
      description: s.description?.replace(/\s+/g, " ").trim(),
      value: s.name,
      category: "Skills",
    }));
  }, [data]);

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
          title="Skills"
          placeholder="Search skills..."
          options={options}
          flat
          onSelect={handleSelect}
          onClose={handleClose}
          footer={<text fg={theme.text.disabled}>↑↓ navigate</text>}
          footerHints={[{ title: "↵", label: "select", side: "right" }]}
          emptyView={
            <box paddingLeft={4} paddingRight={4} paddingTop={1}>
              <text fg={theme.text.muted}>
                {isLoading ? "Loading skills..." : "No skills installed"}
              </text>
            </box>
          }
        />
      </box>
    </box>
  );
}

import { useMemo } from "react";

import { COMMANDS } from "./commands";

import { Dialog } from "@/components/ui/dialog";
import { TextAttributes } from "@opentui/core";
import { theme } from "@scode/theme";

export function HelpDialog({ onClose }: { onClose?: () => void }) {
  const groups = useMemo(() => {
    const map = new Map<string, typeof COMMANDS>();
    for (const cmd of COMMANDS) {
      const cat = cmd.category.charAt(0).toUpperCase() + cmd.category.slice(1);
      const existing = map.get(cat);
      if (existing) existing.push(cmd);
      else map.set(cat, [cmd]);
    }
    return Array.from(map.entries());
  }, []);

  return (
    <Dialog title="Available Commands" open onClose={onClose}>
      {groups.map(([category, cmds], groupIndex) => (
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
          {cmds.map((cmd, i) => {
            const aliases = cmd.aliases.length
              ? ` (${cmd.aliases.map((a) => `/${a}`).join(", ")})`
              : "";
            return (
              <box key={i} height={1} flexDirection="row" width="100%">
                <text fg={theme.brand.primary} width={1}>
                  {" "}
                </text>
                <text
                  fg={theme.brand.primary}
                  flexShrink={0}
                  width={cmd.usage.length + 2}
                >
                  {cmd.usage}
                </text>
                {aliases && (
                  <text
                    fg={theme.text.muted}
                    flexShrink={0}
                    width={aliases.length + 1}
                  >
                    {aliases}
                  </text>
                )}
                <text
                  fg={theme.text.secondary}
                  flexGrow={1}
                  flexShrink={1}
                  overflow="hidden"
                  truncate={true}
                >
                  {cmd.description}
                </text>
              </box>
            );
          })}
        </box>
      ))}
    </Dialog>
  );
}

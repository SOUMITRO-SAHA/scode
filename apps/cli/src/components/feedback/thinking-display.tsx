import { useCallback, useEffect, useState } from "react";

import { Spinner } from "./spinner";

import { theme } from "@scode/theme";

interface ThinkingDisplayProps {
  thought: string;
  thoughtStartTime: number;
  streaming: boolean;
}

function formatElapsed(ms: number): string {
  const s = (ms / 1000).toFixed(1);
  return `${s}s`;
}

export function ThinkingDisplay({
  thought,
  thoughtStartTime,
  streaming,
}: ThinkingDisplayProps) {
  const [elapsed, setElapsed] = useState("0.0s");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!streaming) {
      if (thoughtStartTime > 0) {
        setElapsed(formatElapsed(Date.now() - thoughtStartTime));
      }
      return;
    }
    const id = setInterval(() => {
      if (thoughtStartTime > 0) {
        setElapsed(formatElapsed(Date.now() - thoughtStartTime));
      }
    }, 100);
    return () => clearInterval(id);
  }, [streaming, thoughtStartTime]);

  const toggle = useCallback(() => setCollapsed((c) => !c), []);

  if (!streaming && !thought) return null;

  const arrow = collapsed ? "\u25B6" : "\u25BC";

  return (
    <box
      borderStyle="rounded"
      borderColor={theme.brand.primary}
      paddingLeft={1}
      paddingRight={1}
      paddingTop={0}
      paddingBottom={0}
      marginBottom={1}
    >
      <box flexDirection="column">
        <box
          flexDirection="row"
          alignItems="center"
          gap={1}
          onMouseDown={toggle}
        >
          {streaming && <Spinner delay={80} />}
          <text fg={theme.brand.primary}>Thought: {elapsed}</text>
          <box flexGrow={1} />
          <text fg={theme.icon.secondary}>{arrow}</text>
        </box>
        {!collapsed && thought && <text fg={theme.text.muted}>{thought}</text>}
      </box>
    </box>
  );
}

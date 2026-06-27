import { useEffect, useState } from "react";

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

  if (!streaming && !thought) return null;

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
      <box flexDirection="row" alignItems="center" gap={1}>
        <Spinner delay={80} />
        <text fg={theme.brand.primary}>Thought: {elapsed}</text>
      </box>
      {thought && <text fg={theme.text.muted}>{thought}</text>}
    </box>
  );
}

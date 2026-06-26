import { useEffect, useRef, useState } from "react";

import type { RGBA } from "@opentui/core";
import { theme } from "@scode/theme";

export interface SpinnerProps {
  frames?: string[];
  interval?: number;
  fg?: RGBA;
}

const defaultFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export function Spinner(props: SpinnerProps) {
  const frames = props.frames ?? defaultFrames;
  const interval = props.interval ?? 80;
  const fg = props.fg ?? theme.brand.primary;

  const [frameIndex, setFrameIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % frames.length);
    }, interval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [frames.length, interval]);

  return <text fg={fg}>{frames[frameIndex]}</text>;
}

export interface LoadingSpinnerProps {
  text?: string;
  frames?: string[];
  interval?: number;
  fg?: RGBA;
}

export function LoadingSpinner(props: LoadingSpinnerProps) {
  return (
    <box flexDirection="row" gap={1}>
      <Spinner frames={props.frames} interval={props.interval} fg={props.fg} />
      {props.text && <text fg={theme.text.muted}>{props.text}</text>}
    </box>
  );
}

export function DotsSpinner(props: { fg?: RGBA }) {
  return (
    <Spinner
      frames={["...", " ..", " . ", ".  ", " . ", " .."]}
      interval={200}
      fg={props.fg}
    />
  );
}

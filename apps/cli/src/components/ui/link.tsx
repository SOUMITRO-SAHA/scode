import { exec } from "node:child_process";
import { platform } from "node:os";

import type { RGBA } from "@opentui/core";

export interface LinkProps {
  href: string;
  children?: React.ReactNode | string;
  fg?: RGBA;
  bg?: RGBA;
  width?: number | "auto" | `${number}%`;
  wrapMode?: "word" | "none";
}

export function Link(props: LinkProps) {
  const displayText = props.children ?? props.href;

  return (
    <text
      fg={props.fg}
      bg={props.bg}
      width={props.width}
      wrapMode={props.wrapMode}
      onMouseUp={() => {
        const cmd =
          platform() === "darwin"
            ? `open "${props.href}"`
            : platform() === "win32"
              ? `start "" "${props.href}"`
              : `xdg-open "${props.href}"`;
        exec(cmd).unref();
      }}
    >
      {displayText}
    </text>
  );
}

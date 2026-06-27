import { useEffect, useState } from "react";

import { theme } from "@scode/theme";

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export function Spinner({ delay = 80 }: { delay?: number }) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setFrame((f) => (f + 1) % SPINNER_FRAMES.length);
    }, delay);
    return () => clearInterval(id);
  }, [delay]);

  return <text fg={theme.text.muted}>{SPINNER_FRAMES[frame]}</text>;
}

import { write, writeOsc52 } from "./clipboard";

import type { CliRenderer } from "@opentui/core";

type Toast = {
  show: (input: {
    message: string;
    variant: "info" | "success" | "warning" | "error";
  }) => void;
};

export function copy(renderer: CliRenderer, toast: Toast): boolean {
  const sel = renderer.getSelection();
  if (!sel) return false;

  const text = sel.getSelectedText();
  if (!text) return false;

  writeOsc52(text);
  write(text)
    .then(() => toast.show({ message: "Copied to clipboard", variant: "info" }))
    .catch(() => {});

  renderer.clearSelection();
  return true;
}

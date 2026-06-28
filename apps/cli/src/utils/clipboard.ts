import { execSync } from "node:child_process";

export function isMac(): boolean {
  return process.platform === "darwin";
}

export function readClipboard(): string {
  try {
    if (isMac()) {
      return execSync("pbpaste", { encoding: "utf-8" });
    }
    return execSync("xclip -selection clipboard -o", { encoding: "utf-8" });
  } catch {
    return "";
  }
}

export function writeClipboard(text: string): void {
  try {
    if (isMac()) {
      execSync("pbcopy", { input: text });
    } else {
      execSync("xclip -selection clipboard", { input: text });
    }
  } catch {
    // Silent fail if clipboard tool not available
  }
}

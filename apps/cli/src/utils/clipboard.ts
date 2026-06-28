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

export function writeOsc52(text: string): boolean {
  try {
    const base64 = Buffer.from(text, "utf-8").toString("base64");
    let seq = `\x1b]52;c;${base64}\x07`;
    if (process.env.TMUX) {
      seq = `\x1bPtmux;\x1b${seq}\x1b\\`;
    } else if (process.env.STY) {
      seq = `\x1bP${seq}\x1b\\`;
    }
    process.stdout.write(seq);
    return true;
  } catch {
    return false;
  }
}

export function writeNative(text: string): void {
  try {
    if (isMac()) {
      execSync("pbcopy", { input: text });
    } else {
      execSync("xclip -selection clipboard", { input: text });
    }
  } catch {
    // best effort
  }
}

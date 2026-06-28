import { execFile, execSync, spawn } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

function command(command: string, args: string[] = [], input?: string) {
  return new Promise<Buffer>((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: [input === undefined ? "ignore" : "pipe", "pipe", "ignore"],
    });
    const output: Buffer[] = [];
    child.on("error", reject);
    child.stdout?.on("data", (chunk: Buffer) => output.push(chunk));
    child.on("close", (code) => {
      if (code === 0) return resolve(Buffer.concat(output));
      reject(new Error(`${command} exited with code ${code}`));
    });
    if (input !== undefined) child.stdin?.end(input);
  });
}

export function writeOsc52(text: string) {
  if (!process.stdout.isTTY) return;
  const sequence = `\x1b]52;c;${Buffer.from(text).toString("base64")}\x07`;
  process.stdout.write(
    process.env.TMUX || process.env.STY
      ? `\x1bPtmux;\x1b${sequence}\x1b\\`
      : sequence,
  );
}

export function readClipboard(): string {
  try {
    if (process.platform === "darwin") {
      return execSync("pbpaste", { encoding: "utf-8" });
    }
    return execSync("xclip -selection clipboard -o", { encoding: "utf-8" });
  } catch {
    return "";
  }
}

function hasCommand(name: string): boolean {
  try {
    execFile("which", [name], { encoding: "utf-8" }) as unknown;
    return true;
  } catch {
    return false;
  }
}

export function copyCommand(
  os: NodeJS.Platform,
  wayland: boolean,
  has: (name: string) => boolean,
): string[] | undefined {
  if (os === "darwin" && has("osascript")) return ["osascript"];
  if (os === "linux" && wayland && has("wl-copy")) return ["wl-copy"];
  if (os === "linux" && has("xclip"))
    return ["xclip", "-selection", "clipboard"];
  if (os === "linux" && has("xsel")) return ["xsel", "--clipboard", "--input"];
  if (os === "win32" && has("powershell.exe")) {
    return [
      "powershell.exe",
      "-NonInteractive",
      "-NoProfile",
      "-Command",
      "[Console]::InputEncoding = [System.Text.Encoding]::UTF8; Set-Clipboard -Value ([Console]::In.ReadToEnd())",
    ];
  }
}

let _copyMethod: Promise<(text: string) => Promise<void>> | undefined;

function getCopyMethod() {
  return (_copyMethod ??= (async () => {
    const native = copyCommand(
      process.platform as NodeJS.Platform,
      Boolean(process.env.WAYLAND_DISPLAY),
      hasCommand,
    );
    if (native?.[0] === "osascript") {
      return async (text: string) => {
        const escaped = text.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
        await command("osascript", [
          "-e",
          `set the clipboard to "${escaped}"`,
        ]).catch(() => undefined);
      };
    }
    if (native) {
      return async (text: string) => {
        await command(native[0], native.slice(1), text).catch(() => undefined);
      };
    }
    // fallback: pbcopy on bare mac
    return async (text: string) => {
      await command("pbcopy", [], text).catch(() => {});
    };
  })());
}

export async function write(text: string) {
  writeOsc52(text);
  const method = await getCopyMethod();
  await method(text);
}

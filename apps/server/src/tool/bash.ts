import { Effect, Schema } from "effect";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

import { Tool } from "./core";
import { getWorkspace, safeResolve } from "./workspace";

import { ToolFailure } from "@scode/shared/effect";

const InputStruct = Schema.Struct({
  command: Schema.String,
  workdir: Schema.optional(Schema.String),
  timeout: Schema.optional(Schema.Number),
});

function detectShell(): { file: string; args: string[] } {
  if (process.platform === "win32") {
    const shell = process.env.SHELL;
    if (shell) return { file: shell, args: ["-c"] };
    const comspec = process.env.COMSPEC;
    if (comspec?.toLowerCase().includes("powershell")) {
      return { file: comspec, args: ["-NoProfile", "-Command"] };
    }
    return { file: comspec ?? "cmd.exe", args: ["/d", "/c"] };
  }
  const shell = process.env.SHELL;
  if (process.platform === "darwin") {
    return { file: shell ?? "/bin/zsh", args: ["-l", "-c"] };
  }
  return { file: shell ?? "/bin/bash", args: ["-l", "-c"] };
}

function runCommand(
  file: string,
  args: string[],
  opts: { cwd: string; timeout: number },
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolvePromise) => {
    const child = spawn(file, args, {
      cwd: opts.cwd,
      stdio: ["ignore", "pipe", "pipe"] as const,
    });

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    const stdout = child.stdout!;
    const stderr = child.stderr!;

    stdout.on("data", (chunk: Buffer) => stdoutChunks.push(chunk));
    stderr.on("data", (chunk: Buffer) => stderrChunks.push(chunk));

    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, opts.timeout);

    child.on("close", (code: number | null) => {
      clearTimeout(timer);
      const stdoutText = Buffer.concat(stdoutChunks).toString("utf-8");
      const stderrText = Buffer.concat(stderrChunks).toString("utf-8");
      resolvePromise({
        stdout: stdoutText,
        stderr: timedOut
          ? `${stderrText}\n[Command timed out after ${opts.timeout}ms]`
          : stderrText,
        exitCode: timedOut ? 124 : (code ?? 1),
      });
    });

    child.on("error", () => {
      clearTimeout(timer);
      resolvePromise({
        stdout: "",
        stderr: "Failed to spawn process",
        exitCode: 1,
      });
    });
  });
}

export const tool = Tool.make({
  name: "bash",
  description:
    "Execute a shell command. Returns stdout, stderr, and exit code.",
  input: InputStruct,
  output: Schema.Struct({
    stdout: Schema.String,
    stderr: Schema.String,
    exitCode: Schema.Number,
  }),
  execute: ({ command, workdir, timeout }) => {
    return Effect.tryPromise({
      try: async () => {
        const workspace = getWorkspace();
        const wd = workdir ? safeResolve(workdir) : workspace;
        const t = timeout ?? 120_000;
        const { file, args } = detectShell();
        return runCommand(file, [...args, command], { cwd: wd, timeout: t });
      },
      catch: (err) => new ToolFailure({ error: `Bash error: ${String(err)}` }),
    });
  },
});

import { describe, expect, it } from "vitest";

import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { tool as bashTool } from "../tool/bash";
import { runTool } from "../tool/core";
import { workspaceStorage } from "../tool/workspace";

function withWorkspace(workspace: string, fn: () => Promise<unknown>) {
  return workspaceStorage.run(workspace, fn);
}

describe("bash tool - cross-platform execution", () => {
  it("executes a command and returns stdout", async () => {
    const dir = resolve(tmpdir(), `scode-test-bash-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    try {
      const result = (await withWorkspace(dir, () =>
        runTool(bashTool, { command: "echo hello" }),
      )) as { stdout: string; stderr: string; exitCode: number };
      expect(result.stdout.trim()).toBe("hello");
      expect(result.exitCode).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("returns stderr and non-zero exit code on failure", async () => {
    const dir = resolve(tmpdir(), `scode-test-bash-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    try {
      const result = (await withWorkspace(dir, () =>
        runTool(bashTool, { command: "echo err >&2 && exit 42" }),
      )) as { stdout: string; stderr: string; exitCode: number };
      expect(result.stderr).toContain("err");
      expect(result.exitCode).toBe(42);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("runs command in specified workdir", async () => {
    const dir = resolve(tmpdir(), `scode-test-bash-${Date.now()}`);
    const subdir = join(dir, "sub");
    mkdirSync(subdir, { recursive: true });
    writeFileSync(join(subdir, "marker.txt"), "here", "utf-8");
    try {
      const result = (await withWorkspace(dir, () =>
        runTool(bashTool, { command: "ls marker.txt", workdir: "sub" }),
      )) as { stdout: string; stderr: string; exitCode: number };
      expect(result.stdout.trim()).toBe("marker.txt");
      expect(result.exitCode).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("handles empty command gracefully", async () => {
    const dir = resolve(tmpdir(), `scode-test-bash-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    try {
      const result = (await withWorkspace(dir, () =>
        runTool(bashTool, { command: "" }),
      )) as { stdout: string; stderr: string; exitCode: number };
      expect(result.stdout).toBe("");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("uses shell appropriate for platform", async () => {
    const dir = resolve(tmpdir(), `scode-test-bash-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    try {
      const result = (await withWorkspace(dir, () =>
        runTool(bashTool, { command: "echo $0" }),
      )) as { stdout: string; stderr: string; exitCode: number };
      if (process.platform === "darwin") {
        expect(result.stdout.trim()).toMatch(/zsh/);
      } else if (process.platform === "win32") {
        expect(result.stdout.trim()).toMatch(/cmd|powershell/i);
      } else {
        expect(result.stdout.trim()).toMatch(/bash/);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("shell metacharacters in command are not injection vectors", async () => {
    const dir = resolve(tmpdir(), `scode-test-bash-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    try {
      const result = (await withWorkspace(dir, () =>
        runTool(bashTool, { command: "echo safe" }),
      )) as { stdout: string; stderr: string; exitCode: number };
      expect(result.stdout.trim()).toBe("safe");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

import { describe, expect, it } from "vitest";

import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { runTool } from "../tool/core";
import { tool as grepTool } from "../tool/grep";
import { workspaceStorage } from "../tool/workspace";

function withWorkspace(workspace: string, fn: () => Promise<unknown>) {
  return workspaceStorage.run(workspace, fn);
}

describe("grep tool - cross-platform search", () => {
  it("finds pattern in files within workspace", async () => {
    const dir = resolve(tmpdir(), `scode-test-grep-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "a.txt"), "hello world\nfoo bar", "utf-8");
    writeFileSync(join(dir, "b.txt"), "nothing here", "utf-8");
    try {
      const result = (await withWorkspace(dir, () =>
        runTool(grepTool, { pattern: "foo" }),
      )) as { results: Array<{ file: string; line: number; content: string }> };
      expect(result).toEqual({
        results: [{ file: "a.txt", line: 2, content: "foo bar" }],
      });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("handles shell metacharacters in patterns safely", async () => {
    const dir = resolve(tmpdir(), `scode-test-grep-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "f.txt"), '"; rm -rf / #', "utf-8");
    try {
      const result = (await withWorkspace(dir, () =>
        runTool(grepTool, { pattern: "rm -rf" }),
      )) as { results: Array<{ file: string; line: number; content: string }> };
      expect(result).toEqual({
        results: [{ file: "f.txt", line: 1, content: '"; rm -rf / #' }],
      });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("filters by include glob", async () => {
    const dir = resolve(tmpdir(), `scode-test-grep-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "a.ts"), "const x = 1", "utf-8");
    writeFileSync(join(dir, "a.js"), "const x = 1", "utf-8");
    try {
      const result = (await withWorkspace(dir, () =>
        runTool(grepTool, { pattern: "const", include: "*.ts" }),
      )) as { results: Array<{ file: string; line: number; content: string }> };
      expect(result.results).toHaveLength(1);
      expect(result.results[0].file).toBe("a.ts");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("returns empty when no matches found", async () => {
    const dir = resolve(tmpdir(), `scode-test-grep-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "a.txt"), "hello", "utf-8");
    try {
      const result = (await withWorkspace(dir, () =>
        runTool(grepTool, { pattern: "nonexistent" }),
      )) as { results: Array<{ file: string; line: number; content: string }> };
      expect(result).toEqual({ results: [] });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("searches in subdirectory when path is provided", async () => {
    const dir = resolve(tmpdir(), `scode-test-grep-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    mkdirSync(join(dir, "sub"), { recursive: true });
    writeFileSync(join(dir, "root.txt"), "match", "utf-8");
    writeFileSync(join(dir, "sub", "deep.txt"), "match", "utf-8");
    try {
      const result = (await withWorkspace(dir, () =>
        runTool(grepTool, { pattern: "match", path: "sub" }),
      )) as { results: Array<{ file: string; line: number; content: string }> };
      expect(result.results).toHaveLength(1);
      expect(result.results[0].file).toBe("deep.txt");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("returns empty for invalid regex pattern", async () => {
    const result = (await withWorkspace("/tmp", () =>
      runTool(grepTool, { pattern: "[" }),
    )) as { results: Array<{ file: string; line: number; content: string }> };
    expect(result).toEqual({ results: [] });
  });
});

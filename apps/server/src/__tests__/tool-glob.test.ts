import { describe, expect, it } from "vitest";

import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { runTool } from "../tool/core";
import { tool as globTool } from "../tool/glob";
import { workspaceStorage } from "../tool/workspace";

function withWorkspace(workspace: string, fn: () => Promise<unknown>) {
  return workspaceStorage.run(workspace, fn);
}

describe("glob tool - cross-platform file matching", () => {
  it("finds files matching glob pattern", async () => {
    const dir = resolve(tmpdir(), `scode-test-glob-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "a.ts"), "", "utf-8");
    writeFileSync(join(dir, "b.ts"), "", "utf-8");
    writeFileSync(join(dir, "c.js"), "", "utf-8");
    try {
      const result = (await withWorkspace(dir, () =>
        runTool(globTool, { pattern: "*.ts" }),
      )) as { files: string[] };
      expect(result.files).toEqual(expect.arrayContaining(["a.ts", "b.ts"]));
      expect(result.files).toHaveLength(2);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("finds files recursively with ** pattern", async () => {
    const dir = resolve(tmpdir(), `scode-test-glob-${Date.now()}`);
    mkdirSync(join(dir, "src", "lib"), { recursive: true });
    writeFileSync(join(dir, "src", "lib", "util.ts"), "", "utf-8");
    writeFileSync(join(dir, "src", "index.ts"), "", "utf-8");
    try {
      const result = (await withWorkspace(dir, () =>
        runTool(globTool, { pattern: "**/*.ts" }),
      )) as { files: string[] };
      expect(result.files).toEqual(
        expect.arrayContaining(["src/lib/util.ts", "src/index.ts"]),
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("returns empty when no files match pattern", async () => {
    const dir = resolve(tmpdir(), `scode-test-glob-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "a.txt"), "", "utf-8");
    try {
      const result = (await withWorkspace(dir, () =>
        runTool(globTool, { pattern: "*.py" }),
      )) as { files: string[] };
      expect(result).toEqual({ files: [] });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("uses custom search path when provided", async () => {
    const dir = resolve(tmpdir(), `scode-test-glob-${Date.now()}`);
    mkdirSync(join(dir, "src"), { recursive: true });
    mkdirSync(join(dir, "lib"), { recursive: true });
    writeFileSync(join(dir, "src", "a.ts"), "", "utf-8");
    writeFileSync(join(dir, "lib", "b.ts"), "", "utf-8");
    try {
      const result = (await withWorkspace(dir, () =>
        runTool(globTool, { pattern: "*.ts", path: "src" }),
      )) as { files: string[] };
      expect(result.files).toEqual(["src/a.ts"]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("handles shell metacharacters in patterns safely", async () => {
    const dir = resolve(tmpdir(), `scode-test-glob-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "safe.txt"), "", "utf-8");
    try {
      const result = (await withWorkspace(dir, () =>
        runTool(globTool, { pattern: '"; rm -rf / #' }),
      )) as { files: string[] };
      expect(result.files).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

import { describe, expect, it } from "vitest";

import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { runTool } from "../tool/core";
import { tool as editTool } from "../tool/edit";
import { workspaceStorage } from "../tool/workspace";

function withWorkspace(workspace: string, fn: () => Promise<unknown>) {
  return workspaceStorage.run(workspace, fn);
}

describe("edit tool - path safety", () => {
  it("edits a file within the workspace", async () => {
    const dir = resolve(tmpdir(), `scode-test-edit-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "file.txt"), "hello world", "utf-8");
    try {
      const result = await withWorkspace(dir, () =>
        runTool(editTool, {
          path: "file.txt",
          oldString: "hello",
          newString: "hi",
        }),
      );
      expect(result).toEqual({ ok: true });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("rejects absolute path outside workspace", async () => {
    const dir = resolve(tmpdir(), `scode-test-edit-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    try {
      await expect(
        withWorkspace(dir, () =>
          runTool(editTool, {
            path: "/etc/hosts",
            oldString: "127.0.0.1",
            newString: "0.0.0.0",
          }),
        ),
      ).rejects.toThrow("Path escapes workspace");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("rejects relative path escaping workspace via ..", async () => {
    const dir = resolve(tmpdir(), `scode-test-edit-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    try {
      await expect(
        withWorkspace(dir, () =>
          runTool(editTool, {
            path: "../outside.txt",
            oldString: "a",
            newString: "b",
          }),
        ),
      ).rejects.toThrow("Path escapes workspace");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("rejects path to sibling directory sharing workspace prefix", async () => {
    const dir = resolve(tmpdir(), `scode-test-edit-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    try {
      await expect(
        withWorkspace(dir, () =>
          runTool(editTool, {
            path: `../${dir.split("/").pop()}-evil/file.txt`,
            oldString: "a",
            newString: "b",
          }),
        ),
      ).rejects.toThrow("Path escapes workspace");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("throws when oldString not found", async () => {
    const dir = resolve(tmpdir(), `scode-test-edit-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "file.txt"), "hello world", "utf-8");
    try {
      await expect(
        withWorkspace(dir, () =>
          runTool(editTool, {
            path: "file.txt",
            oldString: "nonexistent",
            newString: "x",
          }),
        ),
      ).rejects.toThrow("oldString not found");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("throws on multiple matches without replaceAll", async () => {
    const dir = resolve(tmpdir(), `scode-test-edit-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "file.txt"), "a a a", "utf-8");
    try {
      await expect(
        withWorkspace(dir, () =>
          runTool(editTool, {
            path: "file.txt",
            oldString: "a",
            newString: "b",
          }),
        ),
      ).rejects.toThrow("Multiple matches");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("replaces all with replaceAll flag", async () => {
    const dir = resolve(tmpdir(), `scode-test-edit-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "file.txt"), "a a a", "utf-8");
    try {
      const result = await withWorkspace(dir, () =>
        runTool(editTool, {
          path: "file.txt",
          oldString: "a",
          newString: "b",
          replaceAll: true,
        }),
      );
      expect(result).toEqual({ ok: true });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

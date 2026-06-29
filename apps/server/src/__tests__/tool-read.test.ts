import { describe, expect, it } from "vitest";

import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, relative, resolve } from "node:path";

import { handler as readHandler } from "../tool/read";
import { workspaceStorage } from "../tool/workspace";

function withWorkspace(workspace: string, fn: () => Promise<unknown>) {
  return workspaceStorage.run(workspace, fn);
}

describe("read tool - path safety", () => {
  it("reads a file within the workspace", async () => {
    const dir = resolve(tmpdir(), `scode-test-read-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "test.txt"), "hello world", "utf-8");
    try {
      const result = await withWorkspace(dir, () =>
        readHandler({ path: "test.txt" }),
      );
      expect(result).toEqual({
        content: "hello world",
        totalLines: 1,
      });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("rejects absolute path outside workspace", async () => {
    const dir = resolve(tmpdir(), `scode-test-read-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    try {
      await expect(
        withWorkspace(dir, () => readHandler({ path: "/etc/passwd" })),
      ).rejects.toThrow("Path escapes workspace");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("rejects relative path escaping workspace via ..", async () => {
    const dir = resolve(tmpdir(), `scode-test-read-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    const evilFile = resolve(tmpdir(), `scode-test-read-evil-${Date.now()}`);
    writeFileSync(evilFile, "secret", "utf-8");
    try {
      const relativeEvil = relative(dir, evilFile);
      await expect(
        withWorkspace(dir, () => readHandler({ path: relativeEvil })),
      ).rejects.toThrow("Path escapes workspace");
    } finally {
      rmSync(dir, { recursive: true, force: true });
      rmSync(evilFile, { force: true });
    }
  });

  it("rejects path to sibling directory sharing workspace prefix", async () => {
    const dir = resolve(tmpdir(), `scode-test-read-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    const siblingDir = dir + "-evil";
    mkdirSync(siblingDir, { recursive: true });
    writeFileSync(join(siblingDir, "file.txt"), "sibling secret", "utf-8");
    try {
      await expect(
        withWorkspace(dir, () =>
          readHandler({
            path: `../${basename(dir)}-evil/file.txt`,
          }),
        ),
      ).rejects.toThrow("Path escapes workspace");
    } finally {
      rmSync(dir, { recursive: true, force: true });
      rmSync(siblingDir, { recursive: true, force: true });
    }
  });

  it("lists directory entries in workspace", async () => {
    const dir = resolve(tmpdir(), `scode-test-read-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "a.txt"), "", "utf-8");
    writeFileSync(join(dir, "b.txt"), "", "utf-8");
    try {
      const result = await withWorkspace(dir, () => readHandler({ path: "." }));
      expect(result).toHaveProperty("entries");
      expect((result as { entries: string[] }).entries).toEqual(
        expect.arrayContaining(["a.txt", "b.txt"]),
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

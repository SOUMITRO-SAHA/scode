import { describe, expect, it } from "vitest";

import { existsSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { workspaceStorage } from "../tool/workspace";
import { handler as writeHandler } from "../tool/write";

function withWorkspace(workspace: string, fn: () => Promise<unknown>) {
  return workspaceStorage.run(workspace, fn);
}

describe("write tool - path safety", () => {
  it("creates a file within the workspace", async () => {
    const dir = resolve(tmpdir(), `scode-test-write-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    try {
      const result = await withWorkspace(dir, () =>
        writeHandler({ path: "new-file.txt", content: "hello" }),
      );
      expect(result).toEqual({ ok: true });
      expect(existsSync(join(dir, "new-file.txt"))).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("rejects absolute path outside workspace", async () => {
    const dir = resolve(tmpdir(), `scode-test-write-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    try {
      await expect(
        withWorkspace(dir, () =>
          writeHandler({
            path: "/tmp/scode-test-write-forbidden",
            content: "evil",
          }),
        ),
      ).rejects.toThrow("Path escapes workspace");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("rejects relative path escaping workspace via ..", async () => {
    const dir = resolve(tmpdir(), `scode-test-write-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    try {
      await expect(
        withWorkspace(dir, () =>
          writeHandler({ path: "../escaped-file.txt", content: "evil" }),
        ),
      ).rejects.toThrow("Path escapes workspace");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("rejects path to sibling directory sharing workspace prefix", async () => {
    const dir = resolve(tmpdir(), `scode-test-write-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    try {
      await expect(
        withWorkspace(dir, () =>
          writeHandler({
            path: `../${dir.split("/").pop()}-evil/evil.txt`,
            content: "evil",
          }),
        ),
      ).rejects.toThrow("Path escapes workspace");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

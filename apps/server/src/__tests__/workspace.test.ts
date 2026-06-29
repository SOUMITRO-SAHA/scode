import { describe, expect, it } from "vitest";

import { Effect } from "effect";
import {
  mkdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import {
  WorkspaceService,
  WorkspaceServiceLive,
  getWorkspace,
  workspaceStorage,
} from "../tool/workspace";

describe("workspace", () => {
  it("getWorkspace returns process.cwd() when no workspace set", () => {
    expect(getWorkspace()).toBe(realpathSync(process.cwd()));
  });

  it("getWorkspace returns stored value within workspaceStorage.run", () => {
    workspaceStorage.run("/custom/workspace", () => {
      expect(getWorkspace()).toBe("/custom/workspace");
    });
  });

  it("getWorkspace falls back to cwd after context exits", () => {
    workspaceStorage.run("/temp/workspace", () => {
      expect(getWorkspace()).toBe("/temp/workspace");
    });
    expect(getWorkspace()).toBe(realpathSync(process.cwd()));
  });

  it("supports nested contexts with correct isolation", () => {
    workspaceStorage.run("/outer", () => {
      expect(getWorkspace()).toBe("/outer");
      workspaceStorage.run("/inner", () => {
        expect(getWorkspace()).toBe("/inner");
      });
      expect(getWorkspace()).toBe("/outer");
    });
  });

  it("multiple concurrent contexts do not leak", async () => {
    const results = await Promise.all([
      new Promise<string>((resolve) =>
        workspaceStorage.run("/a", () => resolve(getWorkspace())),
      ),
      new Promise<string>((resolve) =>
        workspaceStorage.run("/b", () => resolve(getWorkspace())),
      ),
    ]);
    expect(results.sort()).toEqual(["/a", "/b"]);
  });
});

describe("WorkspaceService", () => {
  it("provides getWorkspace as Effect via layer", () => {
    const effect = Effect.gen(function* () {
      const svc = yield* WorkspaceService;
      return yield* svc.getWorkspace;
    });
    const result = Effect.runSync(Effect.provide(effect, WorkspaceServiceLive));
    expect(result).toBe(realpathSync(process.cwd()));
  });

  it("getWorkspace respects workspaceStorage.run context", () => {
    const effect = Effect.gen(function* () {
      const svc = yield* WorkspaceService;
      return yield* svc.getWorkspace;
    });
    const result = Effect.runSync(Effect.provide(effect, WorkspaceServiceLive));
    expect(result).toBe(realpathSync(process.cwd()));
  });

  it("runWithWorkspace scopes a Promise-returning function", async () => {
    const effect = Effect.gen(function* () {
      const svc = yield* WorkspaceService;
      const ws = yield* svc.runWithWorkspace("/scoped-workspace", () =>
        Promise.resolve(getWorkspace()),
      );
      return ws;
    });
    const result = await Effect.runPromise(
      Effect.provide(effect, WorkspaceServiceLive),
    );
    expect(result).toBe("/scoped-workspace");
  });

  it("runWithWorkspace restores original workspace after completion", async () => {
    const before = getWorkspace();
    const effect = Effect.gen(function* () {
      const svc = yield* WorkspaceService;
      yield* svc.runWithWorkspace("/scoped", () => Promise.resolve());
    });
    await Effect.runPromise(Effect.provide(effect, WorkspaceServiceLive));
    expect(getWorkspace()).toBe(before);
  });

  it("getWorkspace as Effect returns fallback cwd when no context", () => {
    const result = Effect.runSync(
      Effect.provide(
        Effect.flatMap(WorkspaceService, (svc) => svc.getWorkspace),
        WorkspaceServiceLive,
      ),
    );
    expect(result).toBe(realpathSync(process.cwd()));
  });
});

describe("safeResolve", () => {
  it("resolves path within workspace", async () => {
    const dir = resolve(tmpdir(), `scode-test-sr-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    await workspaceStorage.run(dir, async () => {
      const { safeResolve } = await import("../tool/workspace");
      expect(safeResolve("foo.txt")).toBe(join(dir, "foo.txt"));
    });
    rmSync(dir, { recursive: true, force: true });
  });

  it("rejects path outside workspace", async () => {
    const dir = resolve(tmpdir(), `scode-test-sr-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    await workspaceStorage.run(dir, async () => {
      const { safeResolve } = await import("../tool/workspace");
      expect(() => safeResolve("/etc/passwd")).toThrow(
        "Path escapes workspace",
      );
    });
    rmSync(dir, { recursive: true, force: true });
  });

  it("rejects relative .. escape", async () => {
    const dir = resolve(tmpdir(), `scode-test-sr-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    await workspaceStorage.run(dir, async () => {
      const { safeResolve } = await import("../tool/workspace");
      expect(() => safeResolve("../../etc/passwd")).toThrow(
        "Path escapes workspace",
      );
    });
    rmSync(dir, { recursive: true, force: true });
  });

  it("allows workspace root itself", async () => {
    const dir = resolve(tmpdir(), `scode-test-sr-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    await workspaceStorage.run(dir, async () => {
      const { safeResolve } = await import("../tool/workspace");
      expect(safeResolve(".")).toBe(dir);
    });
    rmSync(dir, { recursive: true, force: true });
  });

  it("rejects symlink that escapes workspace", async () => {
    const dir = resolve(tmpdir(), `scode-test-sr-${Date.now()}`);
    const outsideDir = resolve(tmpdir(), `scode-test-sr-outside-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    mkdirSync(outsideDir, { recursive: true });
    writeFileSync(join(outsideDir, "secret.txt"), "pwned", "utf-8");
    symlinkSync(outsideDir, join(dir, "link"));
    await workspaceStorage.run(dir, async () => {
      const { safeResolve } = await import("../tool/workspace");
      expect(() => safeResolve("link/secret.txt")).toThrow(
        "Path escapes workspace via symlink",
      );
    });
    rmSync(dir, { recursive: true, force: true });
    rmSync(outsideDir, { recursive: true, force: true });
  });

  it("allows new file path (non-existent, no symlink)", async () => {
    const dir = resolve(tmpdir(), `scode-test-sr-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    await workspaceStorage.run(dir, async () => {
      const { safeResolve } = await import("../tool/workspace");
      expect(safeResolve("new_file.txt")).toBe(join(dir, "new_file.txt"));
    });
    rmSync(dir, { recursive: true, force: true });
  });
});

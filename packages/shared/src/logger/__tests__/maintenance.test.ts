import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { Effect } from "effect";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runMaintenanceEffect } from "../logger";

describe("runMaintenanceEffect", () => {
  const testDir = join(tmpdir(), `scode-maint-effect-${Date.now()}`);

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {}
  });

  it("handles empty directory", async () => {
    await Effect.runPromise(runMaintenanceEffect(testDir));
    const files = await Effect.runPromise(
      Effect.sync(() => {
        const { readdirSync } = require("node:fs") as typeof import("node:fs");
        return readdirSync(testDir);
      }),
    );
    expect(files).toEqual([]);
  });

  it("skips recent log files", async () => {
    writeFileSync(join(testDir, "scode.log"), "recent data");
    await Effect.runPromise(runMaintenanceEffect(testDir));
  });

  it("processes old log files without error", async () => {
    writeFileSync(join(testDir, "scode.2020-01-01.log"), "old data");
    const result = await Effect.runPromise(runMaintenanceEffect(testDir));
    expect(result).toBeUndefined();
  });

  it("handles gz files", async () => {
    writeFileSync(join(testDir, "scode.2020-01-01.log.gz"), "compressed");
    const result = await Effect.runPromise(runMaintenanceEffect(testDir));
    expect(result).toBeUndefined();
  });

  it("does not crash on non-existent directory", async () => {
    const result = await Effect.runPromise(
      runMaintenanceEffect(join(tmpdir(), "non-existent-dir-12345")),
    );
    expect(result).toBeUndefined();
  });
});

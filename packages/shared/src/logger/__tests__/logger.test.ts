import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { Logger, runMaintenance } from "../logger";

vi.mock("pino", () => {
  const mockLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
  const mockPino = vi.fn(() => mockLogger);
  (mockPino as any).transport = vi.fn(() => ({}));
  return { default: mockPino };
});

vi.mock("pino-roll", () => ({}));

describe("Logger", () => {
  const testDir = join(tmpdir(), `scode-test-${Date.now()}`);

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {}
  });

  it("creates log directory", () => {
    const log = new Logger({ logDir: testDir });
    expect(log.logDir).toBe(testDir);
  });

  it("logs at all levels", () => {
    const log = new Logger({ logDir: testDir });
    expect(() => log.debug("test debug")).not.toThrow();
    expect(() => log.info("test info")).not.toThrow();
    expect(() => log.warn("test warn")).not.toThrow();
    expect(() => log.error("test error")).not.toThrow();
  });

  it("logs with data", () => {
    const log = new Logger({ logDir: testDir });
    expect(() => log.info("with data", { key: "val" })).not.toThrow();
  });

  it("close does not throw", () => {
    const log = new Logger({ logDir: testDir });
    expect(() => log.close()).not.toThrow();
  });

  it("uses stderr mode", () => {
    const log = new Logger({ logDir: testDir, stderr: true });
    expect(() => log.info("stderr test")).not.toThrow();
  });

  it("uses custom level", () => {
    const log = new Logger({ logDir: testDir, level: "error" });
    expect(() => log.debug("should not appear")).not.toThrow();
  });

  it("uses SCODE_LOG_DIR env var", () => {
    const orig = process.env.SCODE_LOG_DIR;
    process.env.SCODE_LOG_DIR = testDir;
    const log = new Logger();
    expect(log.logDir).toBe(testDir);
    if (orig) process.env.SCODE_LOG_DIR = orig;
    else delete process.env.SCODE_LOG_DIR;
  });
});

describe("runMaintenance", () => {
  const testDir = join(tmpdir(), `scode-maint-${Date.now()}`);

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {}
  });

  it("handles empty directory", () => {
    expect(() => runMaintenance(testDir)).not.toThrow();
  });

  it("runs on directory with old log files", () => {
    writeFileSync(join(testDir, "scode.2020-01-01.log"), "old data");
    expect(() => runMaintenance(testDir)).not.toThrow();
  });

  it("handles gz files", () => {
    writeFileSync(join(testDir, "scode.2020-01-01.log.gz"), "compressed");
    expect(() => runMaintenance(testDir)).not.toThrow();
  });
});

import { describe, expect, it } from "vitest";

import { dateFromFilename, daysOld } from "../time";

describe("dateFromFilename", () => {
  it("parses dated log filename", () => {
    const d = dateFromFilename("scode.2025-06-01.log");
    expect(d).not.toBeNull();
    expect(d!.toISOString()).toBe("2025-06-01T00:00:00.000Z");
  });

  it("parses dated gz filename", () => {
    const d = dateFromFilename("scode.2025-06-01.log.gz");
    expect(d).not.toBeNull();
    expect(d!.toISOString()).toBe("2025-06-01T00:00:00.000Z");
  });

  it("returns null for non-matching name", () => {
    expect(dateFromFilename("random.txt")).toBeNull();
  });

  it("returns null for name without date part", () => {
    expect(dateFromFilename("scode.log")).toBeNull();
  });

  it("returns null for invalid date", () => {
    expect(dateFromFilename("scode.2025-13-01.log")).toBeNull();
  });
});

describe("daysOld", () => {
  it("returns 0 for today", () => {
    expect(daysOld(new Date())).toBe(0);
  });

  it("returns 1 for yesterday", () => {
    const yesterday = new Date(Date.now() - 86400000);
    expect(daysOld(yesterday)).toBe(1);
  });

  it("returns positive for past dates", () => {
    const old = new Date("2020-01-01T00:00:00Z");
    expect(daysOld(old)).toBeGreaterThan(1000);
  });
});

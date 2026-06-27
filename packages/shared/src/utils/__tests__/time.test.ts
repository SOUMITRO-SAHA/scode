import { describe, expect, it } from "vitest";

import { Effect } from "effect";

import { dateFromFilename, daysOld, formatTime } from "../time";

describe("formatTime", () => {
  it("formats time in 12h format", () => {
    const date = new Date("2025-01-01T14:30:00");
    expect(Effect.runSync(formatTime(date))).toBe("2:30 PM");
  });
});

describe("dateFromFilename", () => {
  it("parses dated log filename", () => {
    const result = Effect.runSync(dateFromFilename("scode.2025-06-01.log"));
    expect(result.toISOString()).toBe("2025-06-01T00:00:00.000Z");
  });

  it("parses dated gz filename", () => {
    const result = Effect.runSync(dateFromFilename("scode.2025-06-01.log.gz"));
    expect(result.toISOString()).toBe("2025-06-01T00:00:00.000Z");
  });

  it("returns error for non-matching name", () => {
    expect(() => Effect.runSync(dateFromFilename("random.txt"))).toThrow();
  });

  it("returns error for name without date part", () => {
    expect(() => Effect.runSync(dateFromFilename("scode.log"))).toThrow();
  });

  it("returns error for invalid date", () => {
    expect(() =>
      Effect.runSync(dateFromFilename("scode.2025-13-01.log")),
    ).toThrow();
  });
});

describe("daysOld", () => {
  it("returns 0 for today", () => {
    expect(Effect.runSync(daysOld(new Date()))).toBe(0);
  });

  it("returns 1 for yesterday", () => {
    const yesterday = new Date(Date.now() - 86400000);
    expect(Effect.runSync(daysOld(yesterday))).toBe(1);
  });

  it("returns positive for past dates", () => {
    const old = new Date("2020-01-01T00:00:00Z");
    expect(Effect.runSync(daysOld(old))).toBeGreaterThan(1000);
  });
});

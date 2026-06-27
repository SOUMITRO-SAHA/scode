import { describe, expect, it } from "vitest";

import { Effect } from "effect";

import { calcUptime, clamp } from "../number";

describe("clamp", () => {
  it("returns value when within range", () => {
    expect(Effect.runSync(clamp(5, 0, 10))).toBe(5);
  });

  it("returns min when below range", () => {
    expect(Effect.runSync(clamp(-5, 0, 10))).toBe(0);
  });

  it("returns max when above range", () => {
    expect(Effect.runSync(clamp(15, 0, 10))).toBe(10);
  });

  it("handles equal min/max", () => {
    expect(Effect.runSync(clamp(5, 5, 5))).toBe(5);
  });
});

describe("calcUptime", () => {
  it("returns 0 for current time", () => {
    expect(Effect.runSync(calcUptime(Date.now()))).toBe(0);
  });

  it("returns positive for past start time", () => {
    const oneHourAgo = Date.now() - 3600000;
    expect(Effect.runSync(calcUptime(oneHourAgo))).toBe(3600);
  });
});

import { describe, expect, it } from "vitest";

import { getBreakpoint, getComposerLines, isWide } from "../layout";

describe("getBreakpoint", () => {
  it("returns sm for width below md threshold", () => {
    expect(getBreakpoint(79)).toBe("sm");
    expect(getBreakpoint(99)).toBe("sm");
  });

  it("returns md for width between md and lg thresholds", () => {
    expect(getBreakpoint(100)).toBe("md");
    expect(getBreakpoint(119)).toBe("md");
  });

  it("returns lg for width at or above lg threshold", () => {
    expect(getBreakpoint(120)).toBe("lg");
    expect(getBreakpoint(200)).toBe("lg");
  });

  it("handles boundary values", () => {
    expect(getBreakpoint(80)).toBe("sm");
    expect(getBreakpoint(100)).toBe("md");
    expect(getBreakpoint(120)).toBe("lg");
  });
});

describe("isWide", () => {
  it("returns true for width >= 120", () => {
    expect(isWide(120)).toBe(true);
    expect(isWide(200)).toBe(true);
  });

  it("returns false for width < 120", () => {
    expect(isWide(119)).toBe(false);
    expect(isWide(50)).toBe(false);
  });
});

describe("getComposerLines", () => {
  it("returns compact (1) for height below compact threshold", () => {
    expect(getComposerLines(19)).toBe(1);
    expect(getComposerLines(1)).toBe(1);
  });

  it("returns normal (2) for height between compact and normal thresholds", () => {
    expect(getComposerLines(20)).toBe(2);
    expect(getComposerLines(27)).toBe(2);
  });

  it("returns spacious (3) for height at or above normal threshold", () => {
    expect(getComposerLines(28)).toBe(3);
    expect(getComposerLines(100)).toBe(3);
  });
});

import { describe, expect, it } from "vitest";

import { spacing } from "../spacing";

describe("spacing", () => {
  it("has all tokens", () => {
    expect(spacing[0]).toBe("0");
    expect(spacing[0.5]).toBe("2px");
    expect(spacing[4]).toBe("16px");
    expect(spacing[16]).toBe("64px");
    expect(spacing[20]).toBe("80px");
  });
});

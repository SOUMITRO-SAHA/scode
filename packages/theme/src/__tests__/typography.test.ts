import { describe, expect, it } from "vitest";

import { typography } from "../typography";

describe("typography", () => {
  it("has font families", () => {
    expect(typography.fontFamily.sans).toContain("Inter");
    expect(typography.fontFamily.mono).toContain("Geist Mono");
  });

  it("has font sizes", () => {
    expect(typography.fontSize.display).toBe("48px");
    expect(typography.fontSize.body).toBe("15px");
    expect(typography.fontSize.code).toBe("14px");
  });

  it("has font weights", () => {
    expect(typography.fontWeight.regular).toBe(400);
    expect(typography.fontWeight.bold).toBe(700);
  });

  it("has line heights", () => {
    expect(typography.lineHeight.tight).toBe(1.2);
    expect(typography.lineHeight.relaxed).toBe(1.7);
  });
});

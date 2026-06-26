import { describe, expect, it } from "vitest";

import { colors } from "../colors";

describe("colors", () => {
  it("exports gray scale", () => {
    expect(colors.gray[50]).toBe("#F3F4F6");
    expect(colors.gray[1000]).toBe("#0B0D10");
  });

  it("exports blue scale", () => {
    expect(colors.blue[50]).toBe("#E8F2FF");
    expect(colors.blue[800]).toBe("#183A5A");
  });

  it("exports status colors", () => {
    expect(colors.red[400]).toBe("#EF4444");
    expect(colors.green[400]).toBe("#22C55E");
    expect(colors.yellow[400]).toBe("#F59E0B");
  });

  it("exports syntax colors", () => {
    expect(colors.syntax.keyword).toBe("#C586C0");
    expect(colors.syntax.type).toBe("#4EC9B0");
  });

  it("exports white and black", () => {
    expect(colors.white).toBe("#FFFFFF");
    expect(colors.black).toBe("#111111");
  });
});

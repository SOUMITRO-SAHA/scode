import { describe, expect, it } from "vitest";

import { getCwd } from "../cwd";

describe("getCwd", () => {
  it("returns the current working directory", () => {
    const result = getCwd();
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("returns a real path (resolved symlinks)", () => {
    const result = getCwd();
    // Should not throw and should be an absolute path
    expect(result.startsWith("/")).toBe(true);
  });
});

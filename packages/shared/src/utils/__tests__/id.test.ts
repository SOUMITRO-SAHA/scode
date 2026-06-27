import { describe, expect, it } from "vitest";

import { Effect } from "effect";

import { generateId } from "../id";

describe("generateId", () => {
  it("returns a string", () => {
    const result = Effect.runSync(generateId);
    expect(typeof result).toBe("string");
  });

  it("returns unique values", () => {
    const ids = new Set(
      Array.from({ length: 100 }, () => Effect.runSync(generateId)),
    );
    expect(ids.size).toBe(100);
  });
});

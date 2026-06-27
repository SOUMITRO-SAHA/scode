import { describe, expect, it } from "vitest";

import { Effect } from "effect";

import { errorMessage } from "../error";

describe("errorMessage", () => {
  it("returns message from Error instance", () => {
    expect(Effect.runSync(errorMessage(new Error("something broke")))).toBe(
      "something broke",
    );
  });

  it("returns stringified value for non-Error", () => {
    expect(Effect.runSync(errorMessage("just a string"))).toBe("just a string");
  });

  it("converts number to string", () => {
    expect(Effect.runSync(errorMessage(42))).toBe("42");
  });

  it("converts object to string", () => {
    expect(Effect.runSync(errorMessage({ foo: "bar" }))).toBe(
      "[object Object]",
    );
  });

  it("handles null", () => {
    expect(Effect.runSync(errorMessage(null))).toBe("null");
  });

  it("handles undefined", () => {
    expect(Effect.runSync(errorMessage(undefined))).toBe("undefined");
  });
});

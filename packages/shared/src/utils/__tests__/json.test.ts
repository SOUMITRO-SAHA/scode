import { describe, expect, it } from "vitest";

import { Effect } from "effect";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { readJSONFile, safeJSONParse, writeJSONFile } from "../json";

describe("safeJSONParse", () => {
  it("parses valid JSON", () => {
    expect(Effect.runSync(safeJSONParse('{"a":1}', {}))).toEqual({ a: 1 });
  });

  it("returns fallback for invalid JSON", () => {
    expect(Effect.runSync(safeJSONParse("not json", {}))).toEqual({});
  });

  it("returns fallback for empty string", () => {
    expect(Effect.runSync(safeJSONParse("", []))).toEqual([]);
  });

  it("parses array JSON", () => {
    expect(Effect.runSync(safeJSONParse("[1,2,3]", []))).toEqual([1, 2, 3]);
  });
});

describe("readJSONFile", () => {
  it("returns fallback when file does not exist", () => {
    const result = Effect.runSync(readJSONFile("/nonexistent/path.json", []));
    expect(result).toEqual([]);
  });

  it("reads and parses existing JSON file", () => {
    const dir = mkdtempSync(join(tmpdir(), "json-test-"));
    const filePath = join(dir, "test.json");
    writeFileSync(filePath, JSON.stringify({ hello: "world" }));

    const result = Effect.runSync(readJSONFile(filePath, {}));
    expect(result).toEqual({ hello: "world" });
  });

  it("returns fallback for malformed JSON file", () => {
    const dir = mkdtempSync(join(tmpdir(), "json-test-"));
    const filePath = join(dir, "bad.json");
    writeFileSync(filePath, "not json");

    const result = Effect.runSync(readJSONFile(filePath, {}));
    expect(result).toEqual({});
  });
});

describe("writeJSONFile", () => {
  it("writes JSON file", () => {
    const dir = mkdtempSync(join(tmpdir(), "json-test-"));
    const filePath = join(dir, "out.json");

    Effect.runSync(writeJSONFile(filePath, { a: 1, b: 2 }));

    const { readFileSync } = require("node:fs");
    const content = readFileSync(filePath, "utf-8");
    expect(JSON.parse(content)).toEqual({ a: 1, b: 2 });
  });
});

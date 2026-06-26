import { describe, expect, it } from "vitest";

import { homedir } from "node:os";
import { join } from "node:path";

import {
  SCODE_AUTH_PATH,
  SCODE_CONFIG_PATH,
  SCODE_DB_PATH,
  SCODE_DIR,
  SCODE_LOGS_DIR,
  scodePath,
} from "../paths";

describe("paths", () => {
  it("SCODE_DIR is ~/.scode", () => {
    expect(SCODE_DIR).toBe(join(homedir(), ".scode"));
  });

  it("scodePath joins paths under SCODE_DIR", () => {
    expect(scodePath("logs")).toBe(join(SCODE_DIR, "logs"));
    expect(scodePath("config", "file.json")).toBe(
      join(SCODE_DIR, "config", "file.json"),
    );
  });

  it("exports derived paths", () => {
    expect(SCODE_CONFIG_PATH).toBe(scodePath("config.json"));
    expect(SCODE_AUTH_PATH).toBe(scodePath("auth.json"));
    expect(SCODE_DB_PATH).toBe(scodePath("scode.db"));
    expect(SCODE_LOGS_DIR).toBe(scodePath("logs"));
  });
});

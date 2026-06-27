import { describe, expect, it } from "vitest";

import { CliConfig } from "../services/config";

describe("CliConfig", () => {
  it("has correct default values", () => {
    expect(CliConfig.Default.port).toBe(4100);
    expect(CliConfig.Default.maxPolls).toBe(30);
    expect(CliConfig.Default.pollInterval).toBe(200);
    expect(CliConfig.Default.healthCheckTimeout).toBe(5000);
  });
});

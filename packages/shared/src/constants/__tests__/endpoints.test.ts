import { describe, expect, it } from "vitest";

import {
  DEFAULT_PORT,
  SERVER_HOST,
  apiV1Base,
  healthUrl,
  processUrl,
  serverBase,
  v1ChatUrl,
  v1ConfigUrl,
  v1HealthUrl,
  v1LogsUrl,
  v1ModelDefaultUrl,
  v1ModelsUrl,
  v1ProcessUrl,
  v1ProviderDefaultUrl,
  v1ProviderUrl,
  v1ProvidersUrl,
  v1SessionMessagesUrl,
  v1SessionUrl,
  v1SessionsUrl,
  v1SkillUrl,
  v1SkillsReloadUrl,
  v1SkillsUrl,
  v1SkillsValidateUrl,
  v1StatsUrl,
} from "../endpoints";

describe("serverBase", () => {
  it("uses default port", () => {
    expect(serverBase()).toBe(`http://${SERVER_HOST}:${DEFAULT_PORT}`);
  });

  it("accepts custom port", () => {
    expect(serverBase(5000)).toBe("http://127.0.0.1:5000");
  });
});

describe("apiV1Base", () => {
  it("defaults to serverBase with /api/v1 suffix", () => {
    expect(apiV1Base()).toBe(`${serverBase()}/api/v1`);
  });

  it("accepts custom base", () => {
    expect(apiV1Base("http://localhost:5000")).toBe(
      "http://localhost:5000/api/v1",
    );
  });
});

describe("legacy endpoints", () => {
  it("healthUrl", () => {
    expect(healthUrl()).toBe(`${serverBase()}/health`);
    expect(healthUrl("http://x:1")).toBe("http://x:1/health");
  });

  it("processUrl", () => {
    expect(processUrl()).toBe(`${serverBase()}/process`);
    expect(processUrl("http://x:1")).toBe("http://x:1/process");
  });
});

describe("v1 endpoints", () => {
  const base = "http://test:3000";
  const v1 = `${base}/api/v1`;

  it("v1HealthUrl", () => {
    expect(v1HealthUrl(base)).toBe(`${v1}/health`);
  });

  it("v1ChatUrl", () => {
    expect(v1ChatUrl(base)).toBe(`${v1}/chat`);
  });

  it("v1ProcessUrl", () => {
    expect(v1ProcessUrl(base)).toBe(`${v1}/process`);
  });

  it("v1ProvidersUrl", () => {
    expect(v1ProvidersUrl(base)).toBe(`${v1}/providers`);
  });

  it("v1ProviderUrl encodes provider", () => {
    expect(v1ProviderUrl("claude", base)).toBe(`${v1}/providers/claude`);
    expect(v1ProviderUrl("deep seek", base)).toBe(
      `${v1}/providers/deep%20seek`,
    );
  });

  it("v1ProviderDefaultUrl", () => {
    expect(v1ProviderDefaultUrl(base)).toBe(`${v1}/providers/default`);
  });

  it("v1ModelsUrl", () => {
    expect(v1ModelsUrl(base)).toBe(`${v1}/models`);
  });

  it("v1ModelDefaultUrl", () => {
    expect(v1ModelDefaultUrl(base)).toBe(`${v1}/models/default`);
  });

  it("v1SessionsUrl", () => {
    expect(v1SessionsUrl(base)).toBe(`${v1}/sessions`);
  });

  it("v1SessionUrl encodes id", () => {
    expect(v1SessionUrl("abc", base)).toBe(`${v1}/sessions/abc`);
    expect(v1SessionUrl("a/b", base)).toBe(`${v1}/sessions/a%2Fb`);
  });

  it("v1SessionMessagesUrl", () => {
    expect(v1SessionMessagesUrl("abc", base)).toBe(
      `${v1}/sessions/abc/messages`,
    );
  });

  it("v1SkillsUrl", () => {
    expect(v1SkillsUrl(base)).toBe(`${v1}/skills`);
  });

  it("v1SkillUrl encodes name", () => {
    expect(v1SkillUrl("my-skill", base)).toBe(`${v1}/skills/my-skill`);
  });

  it("v1SkillsReloadUrl", () => {
    expect(v1SkillsReloadUrl(base)).toBe(`${v1}/skills/reload`);
  });

  it("v1SkillsValidateUrl", () => {
    expect(v1SkillsValidateUrl(base)).toBe(`${v1}/skills/validate`);
  });

  it("v1ConfigUrl", () => {
    expect(v1ConfigUrl(base)).toBe(`${v1}/config`);
  });

  it("v1LogsUrl", () => {
    expect(v1LogsUrl(base)).toBe(`${v1}/logs`);
  });

  it("v1StatsUrl", () => {
    expect(v1StatsUrl(base)).toBe(`${v1}/stats`);
  });
});

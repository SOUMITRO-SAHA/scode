import { describe, expect, it } from "vitest";

import {
  ApiFetchError,
  ApiStreamError,
  ApiUrlError,
  ConfigError,
  IdGenerationError,
  LoggerError,
  ModelParseError,
} from "../errors";

describe("ApiFetchError", () => {
  it("formats message with status", () => {
    const err = new ApiFetchError({
      url: "http://localhost:4100/api/v1/chat",
      method: "post",
      status: 500,
    });
    expect(err.message).toBe(
      "POST http://localhost:4100/api/v1/chat failed (500)",
    );
    expect(err._tag).toBe("ApiFetchError");
  });

  it("formats message without status", () => {
    const err = new ApiFetchError({
      url: "http://localhost:4100/api/v1/chat",
      method: "get",
    });
    expect(err.message).toBe("GET http://localhost:4100/api/v1/chat failed");
  });
});

describe("ApiStreamError", () => {
  it("formats message with status", () => {
    const err = new ApiStreamError({
      url: "http://localhost:4100/api/v1/chat",
      status: 503,
    });
    expect(err.message).toContain(
      "Stream to http://localhost:4100/api/v1/chat failed (503)",
    );
    expect(err._tag).toBe("ApiStreamError");
  });
});

describe("ApiUrlError", () => {
  it("formats message", () => {
    const err = new ApiUrlError({ path: "/bad" });
    expect(err.message).toBe('Invalid API URL for path "/bad"');
  });
});

describe("ConfigError", () => {
  it("formats message", () => {
    const err = new ConfigError({ key: "maxTokens" });
    expect(err.message).toBe('Config error for "maxTokens"');
  });
});

describe("IdGenerationError", () => {
  it("formats message", () => {
    const err = new IdGenerationError({});
    expect(err.message).toBe("ID generation failed");
  });
});

describe("ModelParseError", () => {
  it("formats message", () => {
    const err = new ModelParseError({ input: "invalid" });
    expect(err.message).toBe(
      'Failed to parse model string "invalid": Expected format: provider/model',
    );
  });
});

describe("LoggerError", () => {
  it("formats message", () => {
    const err = new LoggerError({ operation: "write" });
    expect(err.message).toBe("Logger write failed");
  });
});

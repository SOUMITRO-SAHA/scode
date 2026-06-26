import { describe, expect, it } from "vitest";

import { apiUrl } from "../api";

describe("apiUrl", () => {
  it("constructs URL with default base", () => {
    const url = apiUrl("/health");
    expect(url).toBe("http://127.0.0.1:4100/api/v1/health");
  });

  it("constructs URL with custom base", () => {
    const url = apiUrl("/chat", "http://localhost:5000");
    expect(url).toBe("http://localhost:5000/api/v1/chat");
  });

  it("handles path with leading slash", () => {
    const url = apiUrl("/skills");
    expect(url).toBe("http://127.0.0.1:4100/api/v1/skills");
  });
});

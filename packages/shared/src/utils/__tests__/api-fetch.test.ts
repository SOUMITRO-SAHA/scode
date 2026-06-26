import { type Mock, beforeEach, describe, expect, it, vi } from "vitest";

import axios from "axios";

import { apiFetch, apiFetchStream } from "../api";

vi.mock("axios");

describe("apiFetch", () => {
  beforeEach(() => {
    (axios as Mock).mockReset();
  });

  it("performs GET request by default", async () => {
    (axios as Mock).mockResolvedValue({ data: { healthy: true } });
    const result = await apiFetch("/health");
    expect(result).toEqual({ healthy: true });
    expect(axios).toHaveBeenCalledWith(
      "http://127.0.0.1:4100/api/v1/health",
      expect.objectContaining({ method: "get" }),
    );
  });

  it("performs POST with body", async () => {
    (axios as Mock).mockResolvedValue({ data: { id: "abc" } });
    const result = await apiFetch("/sessions", {
      method: "POST",
      body: JSON.stringify({ name: "test" }),
    });
    expect(result).toEqual({ id: "abc" });
    expect(axios).toHaveBeenCalledWith(
      "http://127.0.0.1:4100/api/v1/sessions",
      expect.objectContaining({
        method: "post",
        data: JSON.stringify({ name: "test" }),
      }),
    );
  });

  it("uses custom base URL", async () => {
    (axios as Mock).mockResolvedValue({ data: {} });
    await apiFetch("/health", {}, "http://localhost:5000");
    expect(axios).toHaveBeenCalledWith(
      "http://localhost:5000/api/v1/health",
      expect.anything(),
    );
  });

  it("forwards custom headers", async () => {
    (axios as Mock).mockResolvedValue({ data: {} });
    await apiFetch("/test", {
      method: "GET",
      headers: { "X-Custom": "value" } as Record<string, string>,
    });
    const config = (axios as Mock).mock.calls[0][1];
    expect(config.headers["X-Custom"]).toBe("value");
  });

  it("forwards abort signal", async () => {
    (axios as Mock).mockResolvedValue({ data: {} });
    const controller = new AbortController();
    await apiFetch("/test", { signal: controller.signal });
    const config = (axios as Mock).mock.calls[0][1];
    expect(config.signal).toBe(controller.signal);
  });
});

describe("apiFetchStream", () => {
  beforeEach(() => {
    (axios as Mock).mockReset();
  });

  it("performs POST with stream response", async () => {
    const fakeStream = { pipe: vi.fn() };
    (axios as Mock).mockResolvedValue({ data: fakeStream });

    const result = await apiFetchStream("/chat", { message: "hi" });
    expect(result).toBe(fakeStream);
    expect(axios).toHaveBeenCalledWith(
      "http://127.0.0.1:4100/api/v1/chat",
      expect.objectContaining({
        method: "post",
        data: { message: "hi" },
        responseType: "stream",
      }),
    );
  });

  it("uses custom base URL", async () => {
    const fakeStream = { pipe: vi.fn() };
    (axios as Mock).mockResolvedValue({ data: fakeStream });
    await apiFetchStream("/chat", {}, "http://localhost:5000");
    expect(axios).toHaveBeenCalledWith(
      "http://localhost:5000/api/v1/chat",
      expect.anything(),
    );
  });
});

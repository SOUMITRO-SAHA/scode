import { beforeEach, describe, expect, it, vi } from "vitest";

import { Effect } from "effect";

import { apiFetch, apiFetchStream } from "../api";

const mockAxiosInstance = vi.hoisted(() => {
  const instance = vi.fn() as ReturnType<typeof vi.fn> & {
    interceptors: { request: { use: ReturnType<typeof vi.fn> } };
  };
  instance.interceptors = { request: { use: vi.fn() } };
  return instance;
});

vi.mock("axios", () => ({
  default: {
    create: () => mockAxiosInstance,
  },
}));

describe("apiFetch", () => {
  beforeEach(() => {
    mockAxiosInstance.mockReset();
  });

  it("performs GET request by default", async () => {
    mockAxiosInstance.mockResolvedValue({ data: { healthy: true } });
    const result = await Effect.runPromise(apiFetch("/health"));
    expect(result).toEqual({ healthy: true });
  });

  it("performs POST with body", async () => {
    mockAxiosInstance.mockResolvedValue({ data: { id: "abc" } });
    const result = await Effect.runPromise(
      apiFetch("/sessions", {
        method: "POST",
        body: JSON.stringify({ name: "test" }),
      }),
    );
    expect(result).toEqual({ id: "abc" });
  });

  it("uses custom base URL", async () => {
    mockAxiosInstance.mockResolvedValue({ data: {} });
    await Effect.runPromise(apiFetch("/health", {}, "http://localhost:5000"));
  });

  it("forwards custom headers", async () => {
    mockAxiosInstance.mockResolvedValue({ data: {} });
    await Effect.runPromise(
      apiFetch("/test", {
        method: "GET",
        headers: { "X-Custom": "value" } as Record<string, string>,
      }),
    );
  });

  it("forwards abort signal", async () => {
    mockAxiosInstance.mockResolvedValue({ data: {} });
    const controller = new AbortController();
    await Effect.runPromise(apiFetch("/test", { signal: controller.signal }));
  });

  it("returns typed error on failure", async () => {
    mockAxiosInstance.mockRejectedValue(new Error("timeout"));
    const result = await Effect.runPromise(Effect.flip(apiFetch("/fail")));
    expect(result._tag).toBe("ApiFetchError");
    expect(result.message).toContain("/fail");
  });
});

describe("apiFetchStream", () => {
  beforeEach(() => {
    mockAxiosInstance.mockReset();
  });

  it("performs POST with stream response", async () => {
    const fakeStream = { pipe: vi.fn() };
    mockAxiosInstance.mockResolvedValue({ status: 200, data: fakeStream });

    const result = await Effect.runPromise(
      apiFetchStream("/chat", { message: "hi" }),
    );
    expect(result).toBe(fakeStream);
  });

  it("uses custom base URL", async () => {
    const fakeStream = { pipe: vi.fn() };
    mockAxiosInstance.mockResolvedValue({ status: 200, data: fakeStream });
    await Effect.runPromise(
      apiFetchStream("/chat", {}, "http://localhost:5000"),
    );
  });

  it("fails with ApiStreamError on 4xx status", async () => {
    mockAxiosInstance.mockResolvedValue({
      status: 400,
      data: { on: vi.fn() },
    });
    const result = await Effect.runPromise(
      Effect.flip(apiFetchStream("/chat", { message: "bad" })),
    );
    expect(result._tag).toBe("ApiStreamError");
    expect(result.status).toBe(400);
    expect(result.url).toContain("/chat");
  });

  it("fails with ApiStreamError on 5xx status", async () => {
    mockAxiosInstance.mockResolvedValue({
      status: 500,
      data: { on: vi.fn() },
    });
    const result = await Effect.runPromise(
      Effect.flip(apiFetchStream("/chat", { message: "fail" })),
    );
    expect(result._tag).toBe("ApiStreamError");
    expect(result.status).toBe(500);
  });
});

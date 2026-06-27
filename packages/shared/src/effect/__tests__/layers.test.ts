import { describe, expect, it, vi } from "vitest";

import { Effect, ManagedRuntime } from "effect";

import { SharedServicesLive } from "../layers";
import { ApiService, IdService, ModelService, TimeService } from "../services";

vi.mock("../../utils/api", () => ({
  apiFetch: vi.fn(),
  apiFetchStream: vi.fn(),
  apiUrl: vi.fn(
    (path: string, base?: string) =>
      `${base ?? "http://127.0.0.1:4100/api/v1"}${path}`,
  ),
}));

vi.mock("../../utils/id", () => ({
  generateId: Effect.succeed("abc-123"),
}));

vi.mock("../../utils/time", () => ({
  formatTime: vi.fn().mockReturnValue(Effect.succeed("2:30 PM")),
  dateFromFilename: vi.fn(),
  daysOld: vi.fn(),
}));

vi.mock("../../utils/model", () => ({
  parseModelString: vi
    .fn()
    .mockReturnValue(
      Effect.succeed({
        providerId: "claude",
        model: "claude-sonnet-4-20250515",
      }),
    ),
  formatModelName: vi.fn().mockReturnValue(Effect.succeed("Sonnet 4")),
}));

const runtime = ManagedRuntime.make(SharedServicesLive);

describe("SharedServicesLive", () => {
  it("provides ApiService", async () => {
    const result = await runtime.runPromise(
      ApiService.pipe(Effect.flatMap((svc) => svc.url("/test"))),
    );
    expect(result).toBe("http://127.0.0.1:4100/api/v1/test");
  });

  it("provides IdService", async () => {
    const result = await runtime.runPromise(
      IdService.pipe(Effect.flatMap((svc) => svc.generate)),
    );
    expect(result).toBe("abc-123");
  });

  it("provides TimeService", async () => {
    const result = await runtime.runPromise(
      TimeService.pipe(Effect.flatMap((svc) => svc.formatTime(new Date()))),
    );
    expect(result).toBe("2:30 PM");
  });

  it("provides ModelService", async () => {
    const result = await runtime.runPromise(
      ModelService.pipe(Effect.flatMap((svc) => svc.parse("claude/sonnet"))),
    );
    expect(result).toEqual({
      providerId: "claude",
      model: "claude-sonnet-4-20250515",
    });
  });

  it("supports accessing multiple services from one effect", async () => {
    const result = await runtime.runPromise(
      Effect.gen(function* () {
        const api = yield* ApiService;
        const id = yield* IdService;
        return {
          url: yield* api.url("/health"),
          id: yield* id.generate,
        };
      }),
    );
    expect(result.url).toBe("http://127.0.0.1:4100/api/v1/health");
    expect(result.id).toBe("abc-123");
  });
});

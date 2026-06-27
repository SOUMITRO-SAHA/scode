import { type Mock, beforeEach, describe, expect, it, vi } from "vitest";

import { Effect, Layer, ManagedRuntime } from "effect";

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
  formatTime: vi.fn(),
  dateFromFilename: vi.fn(),
  daysOld: vi.fn(),
}));

vi.mock("../../utils/model", () => ({
  parseModelString: vi.fn(),
  formatModelName: vi.fn(),
}));

const TestLayer = Layer.mergeAll(
  ApiService.Live,
  IdService.Live,
  TimeService.Live,
  ModelService.Live,
);

const runtime = ManagedRuntime.make(TestLayer);

function mockOf(fn: unknown): Mock {
  return fn as Mock;
}

describe("ApiService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetch performs GET request and returns data", async () => {
    const { apiFetch } = await import("../../utils/api");
    mockOf(apiFetch).mockReturnValue(Effect.succeed({ healthy: true }));

    const result = await runtime.runPromise(
      ApiService.pipe(
        Effect.flatMap((svc) => svc.fetch<{ healthy: boolean }>("/health")),
      ),
    );

    expect(result).toEqual({ healthy: true });
    expect(mockOf(apiFetch)).toHaveBeenCalledWith(
      "/health",
      undefined,
      undefined,
    );
  });

  it("fetch returns typed error on failure", async () => {
    const { apiFetch } = await import("../../utils/api");
    mockOf(apiFetch).mockReturnValue(
      Effect.fail(
        Object.assign(new Error("timeout"), { _tag: "ApiFetchError" }),
      ),
    );

    const result = await runtime.runPromise(
      Effect.flip(ApiService.pipe(Effect.flatMap((svc) => svc.fetch("/fail")))),
    );

    expect(result._tag).toBe("ApiFetchError");
  });

  it("url constructs URL", async () => {
    const result = await runtime.runPromise(
      ApiService.pipe(Effect.flatMap((svc) => svc.url("/health"))),
    );
    expect(result).toBe("http://127.0.0.1:4100/api/v1/health");
  });
});

describe("IdService", () => {
  it("generate returns id string", async () => {
    const result = await runtime.runPromise(
      IdService.pipe(Effect.flatMap((svc) => svc.generate)),
    );
    expect(result).toBe("abc-123");
  });
});

describe("TimeService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("formatTime returns formatted string", async () => {
    const { formatTime } = await import("../../utils/time");
    mockOf(formatTime).mockReturnValue(Effect.succeed("2:30 PM"));
    const date = new Date("2025-01-01T14:30:00");

    const result = await runtime.runPromise(
      TimeService.pipe(Effect.flatMap((svc) => svc.formatTime(date))),
    );

    expect(result).toBe("2:30 PM");
    expect(mockOf(formatTime)).toHaveBeenCalledWith(date);
  });
});

describe("ModelService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("parse returns provider and model", async () => {
    const { parseModelString } = await import("../../utils/model");
    mockOf(parseModelString).mockReturnValue(
      Effect.succeed({
        providerId: "claude",
        model: "claude-sonnet-4-20250515",
      }),
    );

    const result = await runtime.runPromise(
      ModelService.pipe(
        Effect.flatMap((svc) => svc.parse("claude/claude-sonnet-4-20250515")),
      ),
    );

    expect(result).toEqual({
      providerId: "claude",
      model: "claude-sonnet-4-20250515",
    });
  });

  it("parse returns error for invalid input", async () => {
    const { parseModelString } = await import("../../utils/model");
    mockOf(parseModelString).mockReturnValue(
      Effect.fail(
        Object.assign(new Error("parse failed"), { _tag: "ModelParseError" }),
      ),
    );

    const result = await runtime.runPromise(
      Effect.flip(
        ModelService.pipe(Effect.flatMap((svc) => svc.parse("invalid"))),
      ),
    );

    expect(result._tag).toBe("ModelParseError");
  });

  it("formatName returns formatted name", async () => {
    const { formatModelName } = await import("../../utils/model");
    mockOf(formatModelName).mockReturnValue(Effect.succeed("Sonnet 4"));

    const result = await runtime.runPromise(
      ModelService.pipe(
        Effect.flatMap((svc) => svc.formatName("claude-sonnet-4-20250515")),
      ),
    );

    expect(result).toBe("Sonnet 4");
  });
});

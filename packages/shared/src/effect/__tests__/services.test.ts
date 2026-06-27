import { beforeEach, describe, expect, it, vi } from "vitest";

import { Effect, Layer, ManagedRuntime } from "effect";

import { apiFetch as rawApiFetch } from "../../utils/api";
import { generateId as rawGenerateId } from "../../utils/id";
import { formatModelName, parseModelString } from "../../utils/model";
import { formatTime as rawFormatTime } from "../../utils/time";
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
  generateId: vi.fn(),
}));

vi.mock("../../utils/time", () => ({
  formatTime: vi.fn(),
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

describe("ApiService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetch performs GET request and returns data", async () => {
    (rawApiFetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      healthy: true,
    });

    const result = await runtime.runPromise(
      ApiService.pipe(
        Effect.flatMap((svc) => svc.fetch<{ healthy: boolean }>("/health")),
      ),
    );

    expect(result).toEqual({ healthy: true });
    expect(rawApiFetch).toHaveBeenCalledWith("/health", undefined, undefined);
  });

  it("fetch returns typed error on failure", async () => {
    (rawApiFetch as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("timeout"),
    );

    const result = await runtime.runPromise(
      ApiService.pipe(
        Effect.flatMap((svc) => svc.fetch("/fail")),
        Effect.flip,
      ),
    );

    expect(result._tag).toBe("ApiFetchError");
    expect(result.message).toContain("/fail");
  });

  it("url constructs URL", async () => {
    const result = await runtime.runPromise(
      ApiService.pipe(Effect.flatMap((svc) => svc.url("/health"))),
    );

    expect(result).toBe("http://127.0.0.1:4100/api/v1/health");
  });
});

describe("IdService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generate returns id string", async () => {
    (rawGenerateId as ReturnType<typeof vi.fn>).mockReturnValue("abc-123");

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
    (rawFormatTime as ReturnType<typeof vi.fn>).mockReturnValue("2:30 PM");
    const date = new Date("2025-01-01T14:30:00");

    const result = await runtime.runPromise(
      TimeService.pipe(Effect.flatMap((svc) => svc.formatTime(date))),
    );

    expect(result).toBe("2:30 PM");
    expect(rawFormatTime).toHaveBeenCalledWith(date);
  });
});

describe("ModelService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("parse returns provider and model", async () => {
    (parseModelString as ReturnType<typeof vi.fn>).mockReturnValue({
      providerId: "claude",
      model: "claude-sonnet-4-20250515",
    });

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
    (parseModelString as ReturnType<typeof vi.fn>).mockReturnValue(null);

    const result = await runtime.runPromise(
      ModelService.pipe(
        Effect.flatMap((svc) => svc.parse("invalid")),
        Effect.flip,
      ),
    );

    expect(result._tag).toBe("ModelParseError");
    expect(result.message).toContain("Expected format: provider/model");
  });

  it("formatName returns formatted name", async () => {
    (formatModelName as ReturnType<typeof vi.fn>).mockReturnValue("Sonnet 4");

    const result = await runtime.runPromise(
      ModelService.pipe(
        Effect.flatMap((svc) => svc.formatName("claude-sonnet-4-20250515")),
      ),
    );

    expect(result).toBe("Sonnet 4");
  });
});

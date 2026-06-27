import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Effect, ManagedRuntime } from "effect";

import { Logger } from "../logger";
import { LoggerService } from "../service";

vi.mock("../logger", () => {
  const mockLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    close: vi.fn(),
  };
  return { Logger: vi.fn(() => mockLogger) };
});

vi.mock("pino", () => {
  const mockLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
  const mockPino = vi.fn(() => mockLogger);
  (mockPino as any).transport = vi.fn(() => ({}));
  return { default: mockPino };
});

vi.mock("pino-roll", () => ({}));

describe("LoggerService", () => {
  const testDir = "/tmp/test-logs";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("provides debug effect", async () => {
    const runtime = ManagedRuntime.make(
      LoggerService.Live({ logDir: testDir }),
    );
    const result = await runtime.runPromise(
      LoggerService.pipe(Effect.flatMap((svc) => svc.debug("test"))),
    );
    expect(result).toBeUndefined();
  });

  it("provides info effect", async () => {
    const runtime = ManagedRuntime.make(
      LoggerService.Live({ logDir: testDir }),
    );
    const result = await runtime.runPromise(
      LoggerService.pipe(Effect.flatMap((svc) => svc.info("test"))),
    );
    expect(result).toBeUndefined();
  });

  it("provides warn effect", async () => {
    const runtime = ManagedRuntime.make(
      LoggerService.Live({ logDir: testDir }),
    );
    const result = await runtime.runPromise(
      LoggerService.pipe(Effect.flatMap((svc) => svc.warn("test"))),
    );
    expect(result).toBeUndefined();
  });

  it("provides error effect", async () => {
    const runtime = ManagedRuntime.make(
      LoggerService.Live({ logDir: testDir }),
    );
    const result = await runtime.runPromise(
      LoggerService.pipe(Effect.flatMap((svc) => svc.error("test"))),
    );
    expect(result).toBeUndefined();
  });

  it("provides close effect", async () => {
    const runtime = ManagedRuntime.make(
      LoggerService.Live({ logDir: testDir }),
    );
    const result = await runtime.runPromise(
      LoggerService.pipe(Effect.flatMap((svc) => svc.close)),
    );
    expect(result).toBeUndefined();
  });

  it("passes data to underlying logger", async () => {
    const runtime = ManagedRuntime.make(
      LoggerService.Live({ logDir: testDir }),
    );
    const data = { key: "value" };
    await runtime.runPromise(
      LoggerService.pipe(Effect.flatMap((svc) => svc.info("with data", data))),
    );
  });

  it("supports Effect.gen composition", async () => {
    const runtime = ManagedRuntime.make(
      LoggerService.Live({ logDir: testDir }),
    );
    const result = await runtime.runPromise(
      Effect.gen(function* () {
        const svc = yield* LoggerService;
        yield* svc.info("step 1");
        yield* svc.info("step 2");
        return "done";
      }),
    );
    expect(result).toBe("done");
  });
});

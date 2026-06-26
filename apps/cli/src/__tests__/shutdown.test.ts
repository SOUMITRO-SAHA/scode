import { beforeEach, describe, expect, it, vi } from "vitest";

import { stopServer } from "../services/daemon";
import {
  getClientId,
  gracefulShutdown,
  setClientId,
  setRendererCleanup,
} from "../services/shutdown";

import { apiFetch } from "@scode/shared/utils";

vi.mock("@scode/shared/utils", () => ({
  apiFetch: vi.fn(),
}));

vi.mock("../services/daemon", () => ({
  stopServer: vi.fn(),
}));

describe("shutdown", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setClientId(null);
    setRendererCleanup(null);
  });

  it("setClientId and getClientId", () => {
    expect(getClientId()).toBeNull();
    setClientId("client-1");
    expect(getClientId()).toBe("client-1");
    setClientId(null);
    expect(getClientId()).toBeNull();
  });

  it("gracefulShutdown without clientId does not call apiFetch", async () => {
    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation(() => undefined as never);
    await gracefulShutdown(0);
    expect(apiFetch).not.toHaveBeenCalled();
    exitSpy.mockRestore();
  });

  it("gracefulShutdown with clientId unregisters", async () => {
    const mockApiFetch = vi.mocked(apiFetch);
    mockApiFetch.mockResolvedValue({
      ok: true,
      wasLast: false,
      activeCount: 1,
    });
    setClientId("client-1");

    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation(() => undefined as never);

    await gracefulShutdown(0, "http://localhost:4100");

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/active-clients/client-1",
      { method: "DELETE" },
      "http://localhost:4100",
    );
    expect(stopServer).not.toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(0);

    exitSpy.mockRestore();
  });

  it("stops server when wasLast is true", async () => {
    const mockApiFetch = vi.mocked(apiFetch);
    mockApiFetch.mockResolvedValue({ ok: true, wasLast: true, activeCount: 0 });
    setClientId("client-1");

    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation(() => undefined as never);

    await gracefulShutdown(0, "http://localhost:4100");

    expect(stopServer).toHaveBeenCalled();
    exitSpy.mockRestore();
  });

  it("handles apiFetch error gracefully", async () => {
    const mockApiFetch = vi.mocked(apiFetch);
    mockApiFetch.mockRejectedValue(new Error("server down"));
    setClientId("client-1");

    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation(() => undefined as never);

    await gracefulShutdown(1, "http://localhost:4100");

    expect(stopServer).not.toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });

  it("setRendererCleanup calls destroy on shutdown", async () => {
    const destroy = vi.fn();
    setRendererCleanup(destroy);

    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation(() => undefined as never);
    await gracefulShutdown(0);
    expect(destroy).toHaveBeenCalled();
    exitSpy.mockRestore();
  });

  it("rendererCleanup is null-safe", async () => {
    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation(() => undefined as never);
    await gracefulShutdown(0);
    expect(exitSpy).toHaveBeenCalledWith(0);
    exitSpy.mockRestore();
  });
});

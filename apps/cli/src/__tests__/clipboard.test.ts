import { beforeEach, describe, expect, it, vi } from "vitest";

import { execSync } from "node:child_process";

import {
  isMac,
  readClipboard,
  writeNative,
  writeOsc52,
} from "../utils/clipboard";

vi.mock("node:child_process", () => ({
  execSync: vi.fn(),
}));

describe("clipboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("isMac", () => {
    it("returns true on darwin", () => {
      vi.stubGlobal("process", { ...process, platform: "darwin" });
      expect(isMac()).toBe(true);
    });

    it("returns false on linux", () => {
      vi.stubGlobal("process", { ...process, platform: "linux" });
      expect(isMac()).toBe(false);
    });

    it("returns false on win32", () => {
      vi.stubGlobal("process", { ...process, platform: "win32" });
      expect(isMac()).toBe(false);
    });
  });

  describe("readClipboard", () => {
    it("uses pbpaste on mac", () => {
      vi.stubGlobal("process", { ...process, platform: "darwin" });
      vi.mocked(execSync).mockReturnValue("clipboard content");

      const result = readClipboard();

      expect(execSync).toHaveBeenCalledWith("pbpaste", { encoding: "utf-8" });
      expect(result).toBe("clipboard content");
    });

    it("uses xclip on linux", () => {
      vi.stubGlobal("process", { ...process, platform: "linux" });
      vi.mocked(execSync).mockReturnValue("linux content");

      const result = readClipboard();

      expect(execSync).toHaveBeenCalledWith("xclip -selection clipboard -o", {
        encoding: "utf-8",
      });
      expect(result).toBe("linux content");
    });

    it("returns empty string on failure", () => {
      vi.stubGlobal("process", { ...process, platform: "darwin" });
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error("command not found");
      });

      const result = readClipboard();

      expect(result).toBe("");
    });
  });

  describe("writeOsc52", () => {
    it("writes base64 encoded text to stdout", () => {
      const writeSpy = vi
        .spyOn(process.stdout, "write")
        .mockImplementation(() => true);

      const ok = writeOsc52("hello");

      expect(ok).toBe(true);
      expect(writeSpy).toHaveBeenCalledWith("\x1b]52;c;aGVsbG8=\x07");
      writeSpy.mockRestore();
    });

    it("wraps in tmux passthrough when TMUX is set", () => {
      vi.stubGlobal("process", {
        ...process,
        env: { ...process.env, TMUX: "1" },
      });
      const writeSpy = vi
        .spyOn(process.stdout, "write")
        .mockImplementation(() => true);

      writeOsc52("hi");

      expect(writeSpy).toHaveBeenCalledWith(
        "\x1bPtmux;\x1b\x1b]52;c;aGk=\x07\x1b\\",
      );
      writeSpy.mockRestore();
    });

    it("returns false on write failure", () => {
      vi.spyOn(process.stdout, "write").mockImplementation(() => {
        throw new Error("write error");
      });

      const ok = writeOsc52("test");

      expect(ok).toBe(false);
    });
  });

  describe("writeNative", () => {
    it("uses pbcopy on mac", () => {
      vi.stubGlobal("process", { ...process, platform: "darwin" });
      vi.mocked(execSync).mockReturnValue(Buffer.from(""));

      writeNative("test text");

      expect(execSync).toHaveBeenCalledWith("pbcopy", { input: "test text" });
    });

    it("uses xclip on linux", () => {
      vi.stubGlobal("process", { ...process, platform: "linux" });
      vi.mocked(execSync).mockReturnValue(Buffer.from(""));

      writeNative("test text");

      expect(execSync).toHaveBeenCalledWith("xclip -selection clipboard", {
        input: "test text",
      });
    });

    it("does not throw on failure", () => {
      vi.stubGlobal("process", { ...process, platform: "darwin" });
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error("command not found");
      });

      expect(() => writeNative("test")).not.toThrow();
    });
  });
});

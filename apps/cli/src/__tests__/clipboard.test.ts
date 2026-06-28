import { describe, expect, it, vi } from "vitest";

import { copyCommand } from "../utils/clipboard";

describe("clipboard", () => {
  describe("copyCommand", () => {
    it("returns osascript on darwin when available", () => {
      const result = copyCommand("darwin", false, () => true);
      expect(result).toEqual(["osascript"]);
    });

    it("returns undefined on darwin when osascript missing", () => {
      const result = copyCommand("darwin", false, () => false);
      expect(result).toBeUndefined();
    });

    it("returns wl-copy on linux with wayland", () => {
      const result = copyCommand("linux", true, (name) => name === "wl-copy");
      expect(result).toEqual(["wl-copy"]);
    });

    it("returns xclip on linux without wayland", () => {
      const result = copyCommand("linux", false, (name) => name === "xclip");
      expect(result).toEqual(["xclip", "-selection", "clipboard"]);
    });

    it("returns xsel on linux without xclip", () => {
      const result = copyCommand("linux", false, (name) => name === "xsel");
      expect(result).toEqual(["xsel", "--clipboard", "--input"]);
    });

    it("returns powershell on win32", () => {
      const result = copyCommand("win32", false, () => true);
      expect(result?.[0]).toBe("powershell.exe");
    });

    it("returns undefined when no command found", () => {
      const result = copyCommand("linux", false, () => false);
      expect(result).toBeUndefined();
    });
  });
});

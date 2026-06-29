import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import { execFileSync } from "node:child_process";

import { handler as globHandler } from "../tool/glob";
import { workspaceStorage } from "../tool/workspace";

vi.mock("node:child_process", () => ({ execFileSync: vi.fn() }));

function withWorkspace(workspace: string, fn: () => Promise<unknown>) {
  return workspaceStorage.run(workspace, fn);
}

describe("glob tool - shell injection prevention", () => {
  beforeEach(() => {
    (execFileSync as Mock).mockReset();
  });

  it("passes pattern as separate argument to execFileSync", async () => {
    (execFileSync as Mock).mockReturnValue("src/file.ts\n");
    const result = await withWorkspace("/workspace", () =>
      globHandler({ pattern: "**/*.ts" }),
    );
    expect(result).toEqual({ files: ["src/file.ts"] });
    expect(execFileSync).toHaveBeenCalledWith(
      "find",
      [
        "/workspace",
        "-path",
        "*/node_modules",
        "-prune",
        "-o",
        "-path",
        "**/*.ts",
        "-print",
      ],
      expect.any(Object),
    );
  });

  it("passes shell metacharacters in pattern as literal arguments", async () => {
    (execFileSync as Mock).mockReturnValue("");
    const malicious = '"; rm -rf / #';
    await withWorkspace("/workspace", () =>
      globHandler({ pattern: malicious }),
    );
    const args = (execFileSync as Mock).mock.calls[0][1];
    expect(args[6]).toBe(malicious);
    expect(execFileSync).toHaveBeenCalledWith(
      "find",
      expect.any(Array),
      expect.any(Object),
    );
  });

  it("handles empty glob output gracefully", async () => {
    (execFileSync as Mock).mockImplementation(() => {
      throw new Error("No matches");
    });
    const result = await withWorkspace("/workspace", () =>
      globHandler({ pattern: "nonexistent/**" }),
    );
    expect(result).toEqual({ files: [] });
  });

  it("uses custom search path when provided", async () => {
    (execFileSync as Mock).mockReturnValue("");
    await withWorkspace("/workspace", () =>
      globHandler({ pattern: "*.ts", path: "src" }),
    );
    const args = (execFileSync as Mock).mock.calls[0][1];
    expect(args[0]).toBe("/workspace/src");
  });
});

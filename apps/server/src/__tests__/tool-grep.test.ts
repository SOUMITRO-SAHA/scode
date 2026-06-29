import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import { execFileSync } from "node:child_process";

import { handler as grepHandler } from "../tool/grep";
import { workspaceStorage } from "../tool/workspace";

vi.mock("node:child_process", () => ({ execFileSync: vi.fn() }));

function withWorkspace(workspace: string, fn: () => Promise<unknown>) {
  return workspaceStorage.run(workspace, fn);
}

describe("grep tool - shell injection prevention", () => {
  beforeEach(() => {
    (execFileSync as Mock).mockReset();
  });

  it("passes pattern as separate argument to execFileSync", async () => {
    (execFileSync as Mock).mockReturnValue("file.txt:1:match");
    const result = await withWorkspace("/workspace", () =>
      grepHandler({ pattern: "search" }),
    );
    expect(result).toEqual({
      results: [{ file: "file.txt", line: 1, content: "match" }],
    });
    expect(execFileSync).toHaveBeenCalledWith(
      "grep",
      ["-rn", "--binary-files=without-match", "search", "/workspace"],
      expect.any(Object),
    );
  });

  it("passes shell metacharacters in pattern as literal arguments", async () => {
    (execFileSync as Mock).mockReturnValue("");
    const malicious = '"; rm -rf / #';
    await withWorkspace("/workspace", () =>
      grepHandler({ pattern: malicious }),
    );
    const args = (execFileSync as Mock).mock.calls[0][1];
    expect(args[2]).toBe(malicious);
    expect(execFileSync).toHaveBeenCalledWith(
      "grep",
      expect.any(Array),
      expect.any(Object),
    );
  });

  it("passes include glob as separate argument", async () => {
    (execFileSync as Mock).mockReturnValue("");
    await withWorkspace("/workspace", () =>
      grepHandler({ pattern: "foo", include: "*.ts" }),
    );
    expect(execFileSync).toHaveBeenCalledWith(
      "grep",
      [
        "-rn",
        "--binary-files=without-match",
        "--include",
        "*.ts",
        "foo",
        "/workspace",
      ],
      expect.any(Object),
    );
  });

  it("handles empty grep output gracefully", async () => {
    (execFileSync as Mock).mockImplementation(() => {
      throw new Error("No matches");
    });
    const result = await withWorkspace("/workspace", () =>
      grepHandler({ pattern: "nothing" }),
    );
    expect(result).toEqual({ results: [] });
  });

  it("includes shell metacharacters in include arg safely", async () => {
    (execFileSync as Mock).mockReturnValue("");
    const maliciousInclude = "*.ts; echo hacked";
    await withWorkspace("/workspace", () =>
      grepHandler({ pattern: "foo", include: maliciousInclude }),
    );
    const args = (execFileSync as Mock).mock.calls[0][1];
    expect(args[2]).toBe("--include");
    expect(args[3]).toBe(maliciousInclude);
    expect(args[4]).toBe("foo");
  });
});

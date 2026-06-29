import { spawn } from "node:child_process";

export interface GrepMatch {
  file: string;
  line: number;
  content: string;
}

export function isIgnoredPath(file: string): boolean {
  return (
    file.startsWith(".git/") ||
    file.startsWith("node_modules/") ||
    file.includes("/.git/") ||
    file.includes("/node_modules/")
  );
}

export function searchText(
  searchPath: string,
  pattern: string,
  options?: { include?: string; fixedStrings?: boolean },
): Promise<GrepMatch[]> {
  return new Promise<GrepMatch[]>((resolve, reject) => {
    const args: string[] = [
      "--json",
      "--no-heading",
      "--line-number",
      "--no-ignore",
      "--no-ignore-vcs",
    ];

    if (options?.include) {
      args.push("--glob", options.include);
    }
    if (options?.fixedStrings) {
      args.push("--fixed-strings");
    }

    args.push("--", pattern, searchPath);

    const child = spawn("rg", args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "ENOENT") {
        reject(
          new Error(
            "ripgrep (rg) is not installed. Install with: brew install ripgrep or see https://github.com/BurntSushi/ripgrep",
          ),
        );
      } else {
        reject(err);
      }
    });

    child.on("close", (code) => {
      if (code === 2) {
        resolve([]);
        return;
      }

      const seen = new Set<string>();
      const results: GrepMatch[] = [];
      for (const line of stdout.trim().split("\n")) {
        if (!line) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.type === "match") {
            const file = parsed.data.path.text;
            const lineNum = parsed.data.line_number;
            const key = `${file}:${lineNum}`;
            if (!seen.has(key)) {
              seen.add(key);
              results.push({
                file,
                line: lineNum,
                content: parsed.data.lines.text.replace(/\n$/, ""),
              });
            }
          }
        } catch {
          // skip malformed JSON lines
        }
      }
      resolve(results);
    });
  });
}

export function listFiles(
  searchPath: string,
  globPattern?: string,
): Promise<string[]> {
  return new Promise<string[]>((resolve, reject) => {
    const args: string[] = ["--files", "--no-ignore", "--no-ignore-vcs"];

    if (globPattern) {
      args.push("--glob", globPattern);
    }

    args.push(searchPath);

    const child = spawn("rg", args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "ENOENT") {
        reject(
          new Error(
            "ripgrep (rg) is not installed. Install with: brew install ripgrep or see https://github.com/BurntSushi/ripgrep",
          ),
        );
      } else {
        reject(err);
      }
    });

    child.on("close", (code) => {
      if (code === 2) {
        resolve([]);
        return;
      }

      const files = stdout.trim().split("\n").filter(Boolean);
      resolve(files);
    });
  });
}

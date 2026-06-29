import { realpathSync } from "node:fs";
import { cwd as processCwd } from "node:process";

import { DebugLogger } from "@scode/shared/logger";

const dbg = new DebugLogger("cwd");

let lastCwd: string | null = null;

export function getCwd(): string {
  const resolved = realpathSync(processCwd());
  if (resolved !== lastCwd) {
    dbg.log(`Resolved cwd: ${resolved}`);
    lastCwd = resolved;
  }
  return resolved;
}

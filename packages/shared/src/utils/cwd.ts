import { realpathSync } from "node:fs";
import { cwd as processCwd } from "node:process";

import { DebugLogger } from "@scode/shared/logger";

const dbg = new DebugLogger("cwd");

const ORIGINAL_CWD = realpathSync(
  process.env.SCODE_ORIGINAL_CWD || processCwd(),
);

export function getCwd(): string {
  dbg.log(`Returning original cwd: ${ORIGINAL_CWD}`);
  return ORIGINAL_CWD;
}

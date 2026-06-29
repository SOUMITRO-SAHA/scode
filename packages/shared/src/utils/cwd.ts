import { realpathSync } from "node:fs";
import { cwd as processCwd } from "node:process";

export function getCwd(): string {
  return realpathSync(processCwd());
}

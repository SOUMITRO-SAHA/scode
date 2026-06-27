import { Effect } from "effect";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

export const safeJSONParse = Effect.fnUntraced(function* <T>(
  str: string,
  fallback: T,
) {
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
});

export const readJSONFile = Effect.fnUntraced(function* <T>(
  path: string,
  fallback: T,
) {
  if (!existsSync(path)) return fallback;
  try {
    const raw = readFileSync(path, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
});

export const writeJSONFile = Effect.fnUntraced(function* (
  path: string,
  data: unknown,
) {
  writeFileSync(path, JSON.stringify(data, null, 2));
});

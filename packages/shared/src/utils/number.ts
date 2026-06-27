import { Effect } from "effect";

export const clamp = Effect.fnUntraced(function* (
  value: number,
  min: number,
  max: number,
) {
  return Math.min(Math.max(value, min), max);
});

export const calcUptime = Effect.fnUntraced(function* (startTime: number) {
  return Math.floor((Date.now() - startTime) / 1000);
});
